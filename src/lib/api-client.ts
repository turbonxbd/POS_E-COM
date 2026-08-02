import { env } from '../config/env.config';
import { APIResponse, APIErrorResponse, APIErrorDetails } from '../types/api.types';
import { localStore } from './storage';

/**
 * Configuration options passed to individual API requests.
 */
export interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined | null>;
  timeout?: number;
  skipAuth?: boolean;
  skipTenantHeader?: boolean;
}

/**
 * Custom error class thrown on API HTTP failure or business error responses.
 */
export class APIClientError extends Error implements APIErrorResponse {
  public success: false = false;
  public statusCode: number;
  public errorCode: string;
  public details?: APIErrorDetails[];
  public path?: string;
  public timestamp: string;

  constructor(errorResponse: APIErrorResponse) {
    super(errorResponse.message);
    this.name = 'APIClientError';
    this.statusCode = errorResponse.statusCode;
    this.errorCode = errorResponse.errorCode;
    this.details = errorResponse.details;
    this.path = errorResponse.path;
    this.timestamp = errorResponse.timestamp || new Date().toISOString();

    // Preserve stack trace in Node / Chrome engines
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, APIClientError);
    }
  }
}

export type RequestInterceptor = (config: { url: string; options: RequestOptions }) => Promise<{ url: string; options: RequestOptions }> | { url: string; options: RequestOptions };
export type ResponseInterceptor = <T>(response: APIResponse<T>) => Promise<APIResponse<T>> | APIResponse<T>;

/**
 * Enterprise Fetch-based HTTP API Client with interceptors, timeouts, multi-tenant headers, and auth tokens.
 */
export class APIClient {
  private baseURL: string;
  private defaultTimeout: number;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  constructor(baseURL: string = env.apiBaseUrl, defaultTimeout: number = env.apiTimeout) {
    this.baseURL = baseURL.replace(/\/$/, '');
    this.defaultTimeout = defaultTimeout;
  }

  /**
   * Registers a request interceptor callback.
   */
  public useRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Registers a response interceptor callback.
   */
  public useResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Main request execution pipeline.
   */
  public async request<T = unknown>(endpoint: string, options: RequestOptions = {}, body?: unknown): Promise<APIResponse<T>> {
    let targetUrl = this.buildFullUrl(endpoint, options.params);
    let requestOptions = { ...options };

    // Apply default headers (Authorization & X-Tenant-ID)
    requestOptions.headers = this.buildHeaders(requestOptions);

    // Run custom request interceptors
    for (const interceptor of this.requestInterceptors) {
      const intercepted = await interceptor({ url: targetUrl, options: requestOptions });
      targetUrl = intercepted.url;
      requestOptions = intercepted.options;
    }

    // Configure request body and content-type header
    let formattedBody: BodyInit | undefined = undefined;
    if (body !== undefined && body !== null) {
      if (body instanceof FormData || body instanceof URLSearchParams || body instanceof Blob) {
        formattedBody = body;
      } else {
        formattedBody = JSON.stringify(body);
        (requestOptions.headers as Record<string, string>)['Content-Type'] = 'application/json';
      }
    }

    // Configure timeout controller
    const timeoutMs = requestOptions.timeout ?? this.defaultTimeout;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Merge signals if caller provided custom AbortSignal
    if (requestOptions.signal) {
      requestOptions.signal.addEventListener('abort', () => controller.abort());
    }

    try {
      const response = await fetch(targetUrl, {
        ...requestOptions,
        body: formattedBody,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse JSON response body (safely handling 204 No Content)
      let parsedData: unknown = null;
      if (response.status !== 204) {
        const text = await response.text();
        parsedData = text ? JSON.parse(text) : null;
      }

      // Check HTTP status ok (200 - 299)
      if (!response.ok) {
        throw this.createAPIError(response.status, endpoint, parsedData);
      }

      // Standardize response payload
      let result: APIResponse<T> = this.isAPIResponse<T>(parsedData)
        ? parsedData
        : {
            success: true,
            statusCode: response.status,
            message: 'Request successful',
            data: parsedData as T,
            timestamp: new Date().toISOString(),
          };

      // Run response interceptors
      for (const interceptor of this.responseInterceptors) {
        result = await interceptor(result);
      }

      return result;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof APIClientError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new APIClientError({
          success: false,
          statusCode: 408,
          errorCode: 'REQUEST_TIMEOUT',
          message: `Request timed out after ${timeoutMs}ms`,
          path: endpoint,
          timestamp: new Date().toISOString(),
        });
      }

      throw new APIClientError({
        success: false,
        statusCode: 500,
        errorCode: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network request failed',
        path: endpoint,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // --- HTTP Helper Methods ---

  public async get<T = unknown>(endpoint: string, options?: RequestOptions): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public async post<T = unknown>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST' }, data);
  }

  public async put<T = unknown>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT' }, data);
  }

  public async patch<T = unknown>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH' }, data);
  }

  public async delete<T = unknown>(endpoint: string, options?: RequestOptions): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // --- Internal Helpers ---

  private buildFullUrl(endpoint: string, params?: RequestOptions['params']): string {
    const isAbsolute = /^https?:\/\//i.test(endpoint);
    const fullPath = isAbsolute ? endpoint : `${this.baseURL}/${endpoint.replace(/^\//, '')}`;

    if (!params || Object.keys(params).length === 0) {
      return fullPath;
    }

    const url = new URL(fullPath);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    return url.toString();
  }

  private buildHeaders(options: RequestOptions): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    // Copy caller headers
    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(options.headers)) {
        options.headers.forEach(([key, value]) => {
          headers[key] = value;
        });
      } else {
        Object.assign(headers, options.headers);
      }
    }

    // Attach Auth Token if not explicitly skipped
    if (!options.skipAuth && !headers['Authorization']) {
      const token = localStore.getItem<string>('auth_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    // Attach Tenant ID if not explicitly skipped
    if (!options.skipTenantHeader && !headers['X-Tenant-ID'] && !headers['x-tenant-id']) {
      const tenantId = localStore.getItem<string>('tenant_id');
      if (tenantId) {
        headers['X-Tenant-ID'] = tenantId;
      }
    }

    return headers;
  }

  private createAPIError(statusCode: number, path: string, rawBody: unknown): APIClientError {
    if (this.isAPIErrorResponse(rawBody)) {
      return new APIClientError(rawBody);
    }

    let errorCode = 'HTTP_ERROR';
    let message = `Request failed with status ${statusCode}`;

    switch (statusCode) {
      case 401:
        errorCode = 'UNAUTHORIZED';
        message = 'Authentication token is invalid or expired.';
        break;
      case 403:
        errorCode = 'FORBIDDEN';
        message = 'You do not have permission to access this resource.';
        break;
      case 404:
        errorCode = 'NOT_FOUND';
        message = 'The requested resource was not found.';
        break;
      case 500:
        errorCode = 'INTERNAL_SERVER_ERROR';
        message = 'An unexpected error occurred on the server.';
        break;
    }

    return new APIClientError({
      success: false,
      statusCode,
      errorCode,
      message,
      path,
      timestamp: new Date().toISOString(),
    });
  }

  private isAPIResponse<T>(obj: unknown): obj is APIResponse<T> {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'success' in obj &&
      typeof (obj as Record<string, unknown>).success === 'boolean' &&
      'statusCode' in obj
    );
  }

  private isAPIErrorResponse(obj: unknown): obj is APIErrorResponse {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'success' in obj &&
      (obj as Record<string, unknown>).success === false &&
      'errorCode' in obj
    );
  }
}

// Ready-to-use exported APIClient instance
export const apiClient = new APIClient();
