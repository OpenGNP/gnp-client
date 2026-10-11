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

// Fired when a request made *with* a token comes back 401 — the token expired (or
// was revoked) while the app was open. AuthProvider listens and flips to signed-out,
// so AppGate sends the user to /login (remembering the page) instead of every
// screen showing its own "Unauthorized" error.
const unauthorizedListeners = new Set<() => void>()

export function onUnauthorized(listener: () => void): () => void {
  unauthorizedListeners.add(listener)
  return () => {
    unauthorizedListeners.delete(listener)
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
// Token renewal: while you're active the server periodically swaps your token
// for a fresh one (gnp-server plugins/jwt.ts) and sends it in this header. Keep it,
// or the stored token would still expire on its original schedule.
const RENEWED_TOKEN_HEADER = 'x-auth-token'

httpClient.interceptors.response.use(
  (response) => {
    const renewed = response.headers[RENEWED_TOKEN_HEADER]
    // Only while signed in — a late response must not sign a logged-out user back in.
    if (typeof renewed === 'string' && renewed && authToken) {
      setAuthToken(renewed)
    }
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
      const sentToken = Boolean(error.config?.headers?.get('Authorization'))
      if (error.response?.status === 401 && sentToken && authToken) {
        setAuthToken(null)
        unauthorizedListeners.forEach((listener) => listener())
      }
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
