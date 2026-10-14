import { useLocation, useNavigate } from 'react-router-dom'

import { ApiError } from '../lib/api'
import { useAuth } from '../lib/auth'
import { ErrorCard } from './ErrorCard'

/**
 * Why a form (editor or dashboard) couldn't be opened, as an ErrorCard:
 * - 403: not this account's form — says who's signed in, offers to switch account.
 * - 404: no such form (bad link, or deleted).
 * - anything else: a generic failure with "Try again".
 * "Back to Home" is always there as the way out.
 */
export function FormLoadError({
  error,
  fallbackMessage,
  onRetry,
}: {
  error: unknown
  /** Shown for failures that aren't 403/404. */
  fallbackMessage: string
  onRetry?: () => void
}) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const status = error instanceof ApiError ? error.status : 0
  const backHome = { label: 'Back to Home', to: '/' }

  // Sign out, then sign back in and land on this same form. `forUserId: null` lets a
  // *different* account continue here (postSignInPath otherwise sends it Home).
  async function switchAccount() {
    const from = `${location.pathname}${location.search}`
    await logout()
    navigate('/login', { state: { from, forUserId: null } })
  }

  if (status === 403) {
    return (
      <ErrorCard
        description="This form belongs to someone else. Ask its owner for access, or sign in with the account that has it."
        note={
          user ? (
            <>
              You're signed in as <span className="font-semibold text-[#3f4045]">{user.email}</span>
            </>
          ) : null
        }
        primaryAction={{ label: 'Switch account', onClick: () => void switchAccount() }}
        secondaryAction={backHome}
        title="You don't have access to this form"
      />
    )
  }

  if (status === 404) {
    return (
      <ErrorCard
        description="Check the link, or find the form from Home."
        secondaryAction={backHome}
        title="This form doesn't exist or was deleted"
      />
    )
  }

  return (
    <ErrorCard
      description={error instanceof ApiError ? error.message : fallbackMessage}
      primaryAction={onRetry ? { label: 'Try again', onClick: onRetry } : undefined}
      secondaryAction={backHome}
      title="Something went wrong"
    />
  )
}
