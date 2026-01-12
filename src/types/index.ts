/**
 * Application-wide type definitions
 */

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  status: number;
  error?: ApiError;
}

/**
 * Standardized API error
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Tenant context
 */
export interface TenantContext {
  id: string;
  brandId: string;
  locale: string;
  timezone: string;
}

/**
 * User session (minimal stub)
 */
export interface AuthSession {
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: number;
}

/**
 * Loading states
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Pagination meta
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}
