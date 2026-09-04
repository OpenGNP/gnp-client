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

export type AuthStatus = 'loading' | 'ready' | 'error'

export type AuthContextValue = {
  user: AuthUser | null
  status: AuthStatus
  error: string | null
  retry: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Dev auto-login. There is no login screen yet, so on startup the client either
 * reuses a stored token (validated against /users/me) or signs in with the
 * VITE_DEV_* credentials from .env. Replace this with a real auth flow later.
 */
async function bootstrapSession(): Promise<AuthUser> {
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

  const email = import.meta.env.VITE_DEV_EMAIL
  const password = import.meta.env.VITE_DEV_PASSWORD
  if (!email || !password) {
    throw new Error(
      'Not signed in, and VITE_DEV_EMAIL / VITE_DEV_PASSWORD are not set in gnp-client/.env.',
    )
  }

  const { user, token } = await apiPost<LoginResponse>('/auth/login', { email, password })
  setAuthToken(token)
  return user
}

// Shared across the StrictMode double-mount so we only hit /auth/login once.
let sessionPromise: Promise<AuthUser> | null = null

export function resolveSession(forceRefresh: boolean): Promise<AuthUser> {
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
