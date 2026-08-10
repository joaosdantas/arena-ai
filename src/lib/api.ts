export class ApiError extends Error {
  readonly status: number
  readonly code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export interface ApiRequestOptions<TBody = unknown> {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: TBody
  headers?: Record<string, string>
  params?: Record<string, string | number | boolean | undefined>
}

export interface ApiClient {
  get<T>(path: string, options?: Omit<ApiRequestOptions, 'body' | 'method'>): Promise<T>
  post<T, TBody>(
    path: string,
    body: TBody,
    options?: Omit<ApiRequestOptions, 'body' | 'method'>,
  ): Promise<T>
  put<T, TBody>(
    path: string,
    body: TBody,
    options?: Omit<ApiRequestOptions, 'body' | 'method'>,
  ): Promise<T>
  patch<T, TBody>(
    path: string,
    body: TBody,
    options?: Omit<ApiRequestOptions, 'body' | 'method'>,
  ): Promise<T>
  delete<T>(path: string, options?: Omit<ApiRequestOptions, 'body' | 'method'>): Promise<T>
}
