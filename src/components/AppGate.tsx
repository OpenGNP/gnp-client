import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'

import { readLastSignedInUserId, useAuth } from '../lib/auth'
import { AppShellSkeleton } from './skeletons/AppShellSkeleton'

/**
 * Holds the app back until the session resolves: sends signed-out visitors to
 * /login (preserving where they were headed), shows a back-to-login card if the API is
 * unreachable (an app-shaped skeleton while it's still resolving), else renders the app.
 */
export function AppGate({ children }: { children: ReactNode }) {
  const { status, error, signedOut } = useAuth()
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
      <div className="w-full max-w-[360px] rounded-[10px] border border-[#e8eaf1] bg-white p-8 text-center shadow-[0_16px_40px_rgba(15,23,42,0.10)]">
        <p className="m-0 mb-1 text-[15px] font-semibold text-[#3f4045]">Unable to connect to the server</p>
        <p className="m-0 mb-5 text-[12px] leading-4 text-[#8b8e98]">{error}</p>
        <Link
          className="inline-flex h-9 w-full items-center justify-center rounded-[6px] bg-[#1e55c5] text-[13px] font-semibold text-white no-underline transition-colors hover:bg-[#1a49aa]"
          state={{ from: `${location.pathname}${location.search}` }}
          to="/login"
        >
          Back to login
        </Link>
      </div>
    </div>
  )
}
