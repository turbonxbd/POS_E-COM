/**
 * Enterprise Input Sanitization & XSS / SQL Injection Protection Engine.
 */

// Regex patterns for dangerous XSS HTML tags, script protocols, and SQL injection syntax
const DANGEROUS_HTML_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const DANGEROUS_PROTOCOLS_REGEX = /javascript\s*:/gi;
const SQL_INJECTION_REGEX = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|UNION|TRUNCATE|EXEC|EXECUTE)\b\s+)/gi;

/**
 * Sanitizes a single string payload against XSS scripts and SQL injection syntax.
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return input;

  let clean = input
    // 1. Strip script tags
    .replace(DANGEROUS_HTML_REGEX, '')
    // 2. Neutralize javascript: URI schemes
    .replace(DANGEROUS_PROTOCOLS_REGEX, 'no-script:')
    // 3. Neutralize SQL keywords if attempting injection
    .replace(SQL_INJECTION_REGEX, (match) => match.toLowerCase().replace(/[a-z]/g, ''));

  // 4. Encode remaining unsafe HTML characters
  clean = clean
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  return clean;
}

/**
 * Recursively sanitizes string properties inside nested JSON request payload objects or arrays.
 */
export function sanitizeObject<T>(data: T): T {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    return sanitizeInput(data) as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeObject(item)) as unknown as T;
  }

  if (typeof data === 'object') {
    const sanitizedObj: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      sanitizedObj[key] = sanitizeObject((data as Record<string, any>)[key]);
    }
    return sanitizedObj as T;
  }

  return data;
}
