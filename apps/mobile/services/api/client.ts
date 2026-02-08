import type { ApiError } from '@/types/api';
import { config } from '@/config';

import { supabase } from '../supabase/client';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RequestOptions extends Omit<RequestInit, 'method' | 'body'> {
  body?: Record<string, unknown>;
  skipAuth?: boolean;
}

async function getAuthToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly defaultHeaders: HeadersInit;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await getAuthToken();
    if (token) {
      return {
        Authorization: `Bearer ${token}`,
      };
    }
    return {};
  }

  private async request<T>(
    method: HttpMethod,
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { body, headers, skipAuth = false, ...restOptions } = options;
    const url = `${this.baseUrl}${endpoint}`;

    const authHeaders = skipAuth ? {} : await this.getAuthHeaders();

    const response = await fetch(url, {
      method,
      headers: {
        ...this.defaultHeaders,
        ...authHeaders,
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      ...restOptions,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const error = (await response.json()) as ApiError;
        errorMessage = error.detail || errorMessage;
      } catch {
        // Response wasn't JSON
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', endpoint, options);
  }

  post<T>(endpoint: string, body?: Record<string, unknown>, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', endpoint, { ...options, body });
  }

  put<T>(endpoint: string, body?: Record<string, unknown>, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', endpoint, { ...options, body });
  }

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', endpoint, options);
  }
}

export const apiClient = new ApiClient(config.apiBaseUrl);
