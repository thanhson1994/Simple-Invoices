import type { InvoiceQueryParams } from '@/types';

/**
 * API Client Utilities
 * 
 * SECURITY: These functions call our own BFF API routes, not external services directly.
 * Tokens are managed server-side and never exposed to the client.
 * 
 * All functions return typed responses and handle errors consistently.
 */

interface ApiResponse<T> {
  data?: T;
  error?: string;
  details?: unknown;
}

/**
 * Base fetch wrapper with error handling
 */
async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include', // Ensure cookies are sent with requests
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    const data: unknown = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      if (typeof data === 'object' && data !== null) {
        const errorPayload = data as { error?: string; details?: unknown };
        return {
          error: errorPayload.error || `Request failed with status ${response.status}`,
          details: errorPayload.details,
        };
      }

      const textPreview = typeof data === 'string' ? data.slice(0, 120) : '';
      return {
        error: `Request failed with status ${response.status}`,
        details: textPreview || response.statusText,
      };
    }

    if (!isJson) {
      return {
        error: 'Expected JSON response but received a non-JSON payload',
        details: typeof data === 'string' ? data.slice(0, 120) : undefined,
      };
    }

    return { data: data as T };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Invoice API Client
 * 
 * Usage:
 * const result = await invoiceApi.getAll();
 * if (result.data) {
 *   // Use invoices
 * } else {
 *   // Handle error
 * }
 */
export const invoiceApi = {
  /**
   * Get all invoices
   */
  async getAll<T>(params?: Record<string, string>) {
    const queryString = params 
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return apiFetch<T>(`/api/invoices${queryString}`);
  },

  /**
   * Get all invoices with typed query params
   */
  async getAllWithQuery<T>(params: InvoiceQueryParams) {
    const query = new URLSearchParams();

    if (params.sortBy) {
      query.set('sortBy', params.sortBy);
    }
    if (params.ordering) {
      query.set('ordering', params.ordering);
    }
    if (params.pageNum) {
      query.set('pageNum', String(params.pageNum));
    }
    if (params.pageSize) {
      query.set('pageSize', String(params.pageSize));
    }
    if (params.status) {
      query.set('status', params.status);
    }
    if (params.keyword) {
      query.set('keyword', params.keyword);
    }
    if (params.fromDate) {
      query.set('fromDate', params.fromDate);
    }
    if (params.toDate) {
      query.set('toDate', params.toDate);
    }

    const queryString = query.toString();
    return apiFetch<T>(`/api/invoices${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get invoice by ID
   */
  async getById<T>(id: string) {
    return apiFetch<T>(`/api/invoices/${id}`);
  },

  /**
   * Create new invoice
   */
  async create<T>(invoice: unknown) {
    return apiFetch<T>('/api/invoices', {
      method: 'POST',
      body: JSON.stringify(invoice),
    });
  },

  /**
   * Update existing invoice
   */
  async update<T>(id: string, invoice: unknown) {
    return apiFetch<T>(`/api/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(invoice),
    });
  },

  /**
   * Delete invoice
   */
  async delete(id: string) {
    return apiFetch(`/api/invoices/${id}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Membership API Client
 * 
 * Usage:
 * const result = await membershipApi.getCurrentUser();
 */
export const membershipApi = {
  /**
   * Get current user's membership
   */
  async getCurrentUser<T>() {
    return apiFetch<T>('/api/membership/users/me');
  },

  /**
   * Get organization details
   */
  async getOrganization<T>(orgId: string) {
    return apiFetch<T>(`/api/membership/organisations/${orgId}`);
  },
};

/**
 * Type-safe error handler
 */
export function handleApiError(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'error' in error) {
    return String(error.error);
  }
  return 'An unexpected error occurred';
}
