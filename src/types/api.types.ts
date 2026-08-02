/**
 * Generic API response metadata structure.
 */
export interface APIMetadata {
  timestamp: string;
  requestId?: string;
  version?: string;
  [key: string]: unknown;
}

/**
 * Field-level validation error structure.
 */
export interface APIErrorDetails {
  field: string;
  message: string;
  code?: string;
}

/**
 * Standardized API Error Response wrapper.
 */
export interface APIErrorResponse {
  success: false;
  statusCode: number;
  errorCode: string;
  message: string;
  details?: APIErrorDetails[];
  path?: string;
  timestamp: string;
}

/**
 * Generic Successful API Response wrapper.
 */
export interface APIResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: APIMetadata;
  timestamp: string;
}

/**
 * Paginated API Data container.
 */
export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Standard query parameters for paginated API requests.
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filter?: Record<string, unknown>;
}
