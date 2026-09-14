import axios, { AxiosError, type AxiosRequestConfig } from 'axios'

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

const TOKEN_STORAGE_KEY = 'gnp.auth.token'

function readStoredToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

let authToken: string | null = readStoredToken()

export function getAuthToken(): string | null {
  return authToken
}

export function setAuthToken(token: string | null): void {
  authToken = token
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY)
    }
  } catch {
    // localStorage unavailable (e.g. private mode) — the in-memory token and the
    // httpOnly auth cookie set by /auth/login still keep the session working.
  }
}

/** Thrown for any non-2xx response or a `{ success: false }` envelope. */
export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type ApiEnvelope<T> = {
  success: boolean
  message: string
  data?: T
}

export const httpClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
})

httpClient.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.set('Authorization', `Bearer ${authToken}`)
  }
  return config
})

// The server wraps every response in `{ success, message, data }`. Unwrap it here
// so callers deal in plain payloads, and turn `success: false` into a thrown ApiError.
httpClient.interceptors.response.use(
  (response) => {
    const envelope = response.data as ApiEnvelope<unknown> | undefined
    if (envelope && typeof envelope === 'object' && 'success' in envelope) {
      if (!envelope.success) {
        throw new ApiError(envelope.message || 'Request failed', response.status)
      }
      response.data = envelope.data
    }
    return response
  },
  (error: unknown) => {
    if (error instanceof ApiError) {
      throw error
    }
    if (error instanceof AxiosError) {
      const envelope = error.response?.data as ApiEnvelope<unknown> | undefined
      throw new ApiError(
        envelope?.message || error.message || 'Request failed',
        error.response?.status ?? 0,
      )
    }
    throw error
  },
)

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await httpClient.get<T>(url, config)
  return response.data as T
}

export async function apiPost<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await httpClient.post<T>(url, body, config)
  return response.data as T
}

export async function apiPatch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await httpClient.patch<T>(url, body, config)
  return response.data as T
}

export async function apiDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await httpClient.delete<T>(url, config)
  return response.data as T
}
