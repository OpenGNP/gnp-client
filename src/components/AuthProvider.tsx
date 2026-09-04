import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import { AuthContext, resolveSession, type AuthStatus, type AuthUser } from '../lib/auth'

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
        setStatus('ready')
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

  return (
    <AuthContext.Provider value={{ user, status, error, retry }}>{children}</AuthContext.Provider>
  )
}
