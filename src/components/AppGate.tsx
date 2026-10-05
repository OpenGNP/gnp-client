import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '../lib/auth'

/**
 * Holds the app back until the session resolves: sends signed-out visitors to
 * /login (preserving where they were headed), shows a back-to-login card if the API is
 * unreachable, else renders the app.
 */
export function AppGate({ children }: { children: ReactNode }) {
  const { status, error } = useAuth()
  const location = useLocation()

  if (status === 'ready') {
    return <>{children}</>
  }

  if (status === 'unauthenticated') {
    return (
      <Navigate
        replace
        state={{ from: `${location.pathname}${location.search}` }}
        to="/login"
      />
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f9ff] px-4 font-['Inter_Variable']">
      <div className="w-full max-w-[360px] rounded-[10px] border border-[#e8eaf1] bg-white p-8 text-center shadow-[0_16px_40px_rgba(15,23,42,0.10)]">
        {status === 'loading' ? (
          <p className="m-0 text-[14px] text-[#8b8e98]">Connecting to the server…</p>
        ) : (
          <>
            <p className="m-0 mb-1 text-[15px] font-semibold text-[#3f4045]">Unable to connect to the server</p>
            <p className="m-0 mb-5 text-[12px] leading-4 text-[#8b8e98]">{error}</p>
            <Link
              className="inline-flex h-9 w-full items-center justify-center rounded-[6px] bg-[#1e55c5] text-[13px] font-semibold text-white no-underline transition-colors hover:bg-[#1a49aa]"
              state={{ from: `${location.pathname}${location.search}` }}
              to="/login"
            >
              Back to login
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
