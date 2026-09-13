import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import {
  AuthContext,
  login as loginRequest,
  logout as logoutRequest,
  resolveSession,
  type AuthStatus,
  type AuthUser,
} from '../lib/auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    resolveSession(attempt > 0)
      .then((resolvedUser) => {
        if (cancelled) return
        setUser(resolvedUser)
        setStatus(resolvedUser ? 'ready' : 'unauthenticated')
      })
      .catch((bootstrapError: unknown) => {
        if (cancelled) return
        setError(
          bootstrapError instanceof Error ? bootstrapError.message : 'Could not reach the API.',
        )
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [attempt])

  function retry() {
    setStatus('loading')
    setError(null)
    setAttempt((value) => value + 1)
  }

  // Doesn't catch — the caller (the login form) shows the failure inline.
  async function login(email: string, password: string) {
    const loggedInUser = await loginRequest(email, password)
    setUser(loggedInUser)
    setStatus('ready')
  }

  async function logout() {
    await logoutRequest()
    setUser(null)
    setStatus('unauthenticated')
  }

  return (
    <AuthContext.Provider value={{ user, status, error, retry, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
