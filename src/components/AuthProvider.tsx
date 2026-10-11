import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import {
  AuthContext,
  login as loginRequest,
  loginWithMicrosoft as loginWithMicrosoftRequest,
  logout as logoutRequest,
  resolveSession,
  type AuthStatus,
  type AuthUser,
} from '../lib/auth'
import { queryClient } from '../lib/queryClient'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [signedOut, setSignedOut] = useState(false)

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
    queryClient.clear() // never show a previous account's cached data
    setSignedOut(false)
    setUser(loggedInUser)
    setStatus('ready')
  }

  async function loginWithMicrosoft(idToken: string, accessToken?: string) {
    const loggedInUser = await loginWithMicrosoftRequest(idToken, accessToken)
    queryClient.clear()
    setSignedOut(false)
    setUser(loggedInUser)
    setStatus('ready')
  }

  async function logout() {
    await logoutRequest()
    queryClient.clear()
    setSignedOut(true)
    setUser(null)
    setStatus('unauthenticated')
  }

  return (
    <AuthContext.Provider value={{ user, status, error, retry, login, loginWithMicrosoft, logout, signedOut }}>
      {children}
    </AuthContext.Provider>
  )
}
