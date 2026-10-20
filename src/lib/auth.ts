import { createContext, useContext } from 'react'

import { ApiError, apiGet, apiPost, getAuthToken, setAuthToken } from './api'
import { msalInstance } from './msal'

export type AuthUser = {
  id: number
  fullName: string | null
  email: string
  role: string | null
  organizationId: number | null
  createdAt?: string | null
  /** Their Microsoft profile photo (`/users/:id/avatar?v=…`); null → initials. */
  avatarUrl?: string | null
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
  loginWithMicrosoft: (idToken: string, accessToken?: string) => Promise<void>
  logout: () => Promise<void>
  /**
   * True after the user pressed "Log out" (until the next sign-in). AppGate then
   * sends them to /login *without* remembering the page they were on, so signing
   * back in starts at Home rather than wherever they logged out from.
   */
  signedOut: boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)

// Who last signed in on this browser — just the numeric id, not a credential, and
// kept even after their token is gone (expired / logged out). AppGate attaches it
// to the "return here after sign-in" state, so if a *different* account signs in,
// LoginPage sends them Home instead of to the previous user's page.
const LAST_USER_KEY = 'gnp.auth.lastUserId'

function rememberSignedInUser(user: AuthUser): void {
  try {
    window.localStorage.setItem(LAST_USER_KEY, String(user.id))
  } catch {
    // Storage unavailable — the redirect check just falls back to "unknown".
  }
}

export function readLastSignedInUserId(): number | null {
  try {
    const raw = window.localStorage.getItem(LAST_USER_KEY)
    const id = raw === null ? NaN : Number(raw)
    return Number.isInteger(id) ? id : null
  } catch {
    return null
  }
}

/**
 * Where to go once signed in: back to `from` only when it was the same account
 * that left it (or nobody was signed in here before — e.g. a link someone shared),
 * otherwise Home.
 */
export function postSignInPath(
  state: { from?: string; forUserId?: number | null } | null,
  user: AuthUser,
): string {
  const from = state?.from
  if (!from) return '/'
  const previous = state?.forUserId ?? null
  return previous === null || previous === user.id ? from : '/'
}

/** POSTs to /auth/login, stores the returned token, and resolves the signed-in user. */
export async function login(email: string, password: string): Promise<AuthUser> {
  const { user, token } = await apiPost<LoginResponse>('/auth/login', { email, password })
  setAuthToken(token)
  rememberSignedInUser(user)
  sessionPromise = Promise.resolve(user)
  return user
}

/** Exchanges a Microsoft ID token (from MSAL) for an app session, like `login`. */
export async function loginWithMicrosoft(idToken: string, accessToken?: string): Promise<AuthUser> {
  const { user, token } = await apiPost<LoginResponse>('/auth/microsoft', {
    idToken,
    accessToken: accessToken || undefined,
  })
  setAuthToken(token)
  rememberSignedInUser(user)
  sessionPromise = Promise.resolve(user)
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
    sessionPromise = null // the next resolveSession must not hand back the old account
    // Forget the cached Microsoft account locally (without signing it out of
    // Microsoft everywhere), so the next sign-in shows the account picker cleanly.
    await msalInstance?.clearCache().catch(() => undefined)
  }
}

/**
 * Resolves the session on startup: reuse a stored token (validated against
 * /users/me), else resolve `null` — "not signed in", which routes to /login. A
 * *thrown* error means the API itself couldn't be reached, not "not logged in" —
 * that still surfaces as AppGate's retry card.
 */
async function bootstrapSession(): Promise<AuthUser | null> {
  if (getAuthToken()) {
    try {
      const user = await apiGet<AuthUser>('/users/me')
      rememberSignedInUser(user)
      return user
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) {
        throw error
      }
      setAuthToken(null)
    }
  }

  return null
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

/**
 * False for accounts with no organization (e.g. a personal Microsoft account) —
 * they can't limit a form to "people in my organization".
 */
export function useHasOrganization(): boolean {
  return useAuth().user?.organizationId != null
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
