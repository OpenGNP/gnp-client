import { createContext, useContext } from 'react'

import { ApiError, apiGet, apiPost, getAuthToken, setAuthToken } from './api'

export type AuthUser = {
  id: number
  fullName: string | null
  email: string
  role: string | null
  organizationId: number | null
  createdAt?: string | null
}

type LoginResponse = {
  user: AuthUser
  token: string
}

export type AuthStatus = 'loading' | 'ready' | 'unauthenticated' | 'error'

export type AuthContextValue = {
  user: AuthUser | null
  status: AuthStatus
  error: string | null
  retry: () => void
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

/** POSTs to /auth/login, stores the returned token, and resolves the signed-in user. */
export async function login(email: string, password: string): Promise<AuthUser> {
  const { user, token } = await apiPost<LoginResponse>('/auth/login', { email, password })
  setAuthToken(token)
  return user
}

/** Clears the server-side auth cookie (best-effort) and the local token either way. */
export async function logout(): Promise<void> {
  try {
    await apiPost('/auth/logout')
  } catch {
    // Still drop the local token even if the request fails (e.g. offline) — a
    // reachable-but-stale session should never keep the client "logged in".
  } finally {
    setAuthToken(null)
  }
}

/**
 * Local-dev convenience only: with VITE_DEV_EMAIL / VITE_DEV_PASSWORD set, sign in
 * automatically on startup instead of hitting the login page every reload. Gated to
 * `import.meta.env.DEV` so a production build never attempts it. Visiting /login
 * directly while this is configured will bounce you back once it resolves — unset
 * the vars locally if you need to exercise the login page itself.
 */
async function devAutoLogin(): Promise<AuthUser | null> {
  if (!import.meta.env.DEV) return null
  const email = import.meta.env.VITE_DEV_EMAIL
  const password = import.meta.env.VITE_DEV_PASSWORD
  if (!email || !password) return null
  return login(email, password)
}

/**
 * Resolves the session on startup: reuse a stored token (validated against
 * /users/me), else try dev auto-login, else resolve `null` — "not signed in", which
 * routes to /login. A *thrown* error means the API itself couldn't be reached, not
 * "not logged in" — that still surfaces as AppGate's retry card.
 */
async function bootstrapSession(): Promise<AuthUser | null> {
  if (getAuthToken()) {
    try {
      return await apiGet<AuthUser>('/users/me')
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) {
        throw error
      }
      setAuthToken(null)
    }
  }

  return devAutoLogin()
}

// Shared across the StrictMode double-mount so we only hit the API once.
let sessionPromise: Promise<AuthUser | null> | null = null

export function resolveSession(forceRefresh: boolean): Promise<AuthUser | null> {
  if (forceRefresh) {
    sessionPromise = null
  }
  if (!sessionPromise) {
    sessionPromise = bootstrapSession().catch((error: unknown) => {
      sessionPromise = null // let a retry try again
      throw error
    })
  }
  return sessionPromise
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
