/**
 * API client service
 * Handles all HTTP communication with tenant-aware headers and error handling
 */

import { ApiResponse, ApiError, TenantContext, AuthSession } from '@types';

const API_BASE_URL = 'https://railway.app';

/**
 * Main API client
 */
export class ApiClient {
  private baseUrl: string;
  private tenantContext: TenantContext | null = null;
  private authSession: AuthSession | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Set tenant context for all subsequent requests
   */
  setTenantContext(context: TenantContext): void {
    this.tenantContext = context;
  }

  /**
   * Set authentication session
   */
  setAuthSession(session: AuthSession | null): void {
    this.authSession = session;
  }

  /**
   * Build request headers with tenant and auth context
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.tenantContext) {
      headers['X-Tenant-ID'] = this.tenantContext.id;
      headers['X-Brand-ID'] = this.tenantContext.brandId;
      headers['X-Locale'] = this.tenantContext.locale;
    }

    if (this.authSession) {
      headers['Authorization'] = `Bearer ${this.authSession.token}`;
    }

    return headers;
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint);
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, body);
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, body);
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint);
  }

  /**
   * Core request handler with error handling
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: unknown
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const options: RequestInit = {
        method,
        headers: this.getHeaders(),
      };

      if (body && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        const error = await this.parseErrorResponse(response);
        return {
          status: response.status,
          data: {} as T,
          error,
        };
      }

      const data = (await response.json()) as T;
      return {
        status: response.status,
        data,
      };
    } catch (error) {
      const apiError: ApiError = {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network request failed',
      };

      return {
        status: 0,
        data: {} as T,
        error: apiError,
      };
    }
  }

  /**
   * Parse error response
   */
  private async parseErrorResponse(response: Response): Promise<ApiError> {
    try {
      const errorBody = (await response.json()) as Record<string, unknown>;
      return {
        code: (errorBody['code'] as string) || `HTTP_${response.status}`,
        message: (errorBody['message'] as string) || response.statusText,
        details: errorBody['details'] as Record<string, unknown>,
      };
    } catch {
      return {
        code: `HTTP_${response.status}`,
        message: response.statusText,
      };
    }
  }
}

// Singleton instance
export const apiClient = new ApiClient();
