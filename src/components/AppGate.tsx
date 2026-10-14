import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { readLastSignedInUserId, useAuth } from '../lib/auth'
import { ErrorCard } from './ErrorCard'
import { AppShellSkeleton } from './skeletons/AppShellSkeleton'

/**
 * Holds the app back until the session resolves: sends signed-out visitors to
 * /login (preserving where they were headed), shows a back-to-login card if the API is
 * unreachable (an app-shaped skeleton while it's still resolving), else renders the app.
 */
export function AppGate({ children }: { children: ReactNode }) {
  const { status, error, retry, signedOut } = useAuth()
  const location = useLocation()

  if (status === 'ready') {
    return <>{children}</>
  }

  if (status === 'unauthenticated') {
    // Remember where they were headed only when they *landed* here signed out (a
    // deep link, an expired session) — not after pressing "Log out", where the
    // next sign-in should start fresh at Home.
    return (
      <Navigate
        replace
        state={
          signedOut
            ? undefined
            : {
                from: `${location.pathname}${location.search}`,
                // Whose page this was — a different account signing in goes Home.
                forUserId: readLastSignedInUserId(),
              }
        }
        to="/login"
      />
    )
  }

  if (status === 'loading') {
    return <AppShellSkeleton />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f9ff] px-4 font-['Inter_Variable']">
      <ErrorCard
        description={error}
        primaryAction={{ label: 'Try again', onClick: retry }}
        secondaryAction={{
          label: 'Back to login',
          to: '/login',
          state: { from: `${location.pathname}${location.search}` },
        }}
        title="Unable to connect to the server"
      />
    </div>
  )
}
