import { BrowserAuthError, BrowserAuthErrorCodes, InteractionStatus } from '@azure/msal-browser'
import { useMsal } from '@azure/msal-react'
import { useEffect, useRef, useState } from 'react'

import { ApiError } from '../lib/api'
import { useAuth } from '../lib/auth'
import { microsoftLoginRequest } from '../lib/msal'

type MicrosoftSignInButtonProps = {
  disabled?: boolean
  onBusyChange: (busy: boolean) => void
  onError: (message: string) => void
}

function MicrosoftLogo() {
  return (
    <svg aria-hidden="true" height="16" viewBox="0 0 21 21" width="16">
      <rect fill="#f25022" height="10" width="10" x="0" y="0" />
      <rect fill="#7fba00" height="10" width="10" x="11" y="0" />
      <rect fill="#00a4ef" height="10" width="10" x="0" y="11" />
      <rect fill="#ffb900" height="10" width="10" x="11" y="11" />
    </svg>
  )
}

// Silent outcomes: the popup was closed, superseded by a newer click, or left open
// until MSAL gave up waiting.
const SILENT_ERRORS: string[] = [
  BrowserAuthErrorCodes.userCancelled,
  BrowserAuthErrorCodes.interactionInProgress,
  BrowserAuthErrorCodes.interactionInProgressCancelled,
  BrowserAuthErrorCodes.timedOut,
]

/**
 * Popup sign-in via MSAL; the resulting ID token is exchanged for an app session.
 *
 * MSAL can't tell when the popup is closed or abandoned (it only listens for
 * /redirect.html's reply, up to 60s). So when focus returns to this window and no
 * reply has come, the button frees itself; a new click overrides the stale attempt.
 */
export function MicrosoftSignInButton({ disabled, onBusyChange, onError }: MicrosoftSignInButtonProps) {
  const { instance, inProgress } = useMsal()
  const { loginWithMicrosoft } = useAuth()
  const [busy, setBusy] = useState(false)
  const attemptRef = useRef(0)
  const phaseRef = useRef<'idle' | 'popup' | 'exchanging'>('idle')

  function setBusyState(next: boolean) {
    setBusy(next)
    onBusyChange(next)
  }

  useEffect(() => {
    if (!busy) return
    let timer = 0
    const handleFocus = () => {
      window.clearTimeout(timer)
      // A sign-in that just finished gets a moment to report back first.
      timer = window.setTimeout(() => {
        if (phaseRef.current !== 'popup') return
        phaseRef.current = 'idle'
        setBusy(false)
        onBusyChange(false)
      }, 1000)
    }
    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.clearTimeout(timer)
    }
  }, [busy, onBusyChange])

  async function handleClick() {
    if (busy) return
    const attempt = ++attemptRef.current
    onError('')
    phaseRef.current = 'popup'
    setBusyState(true)
    try {
      const result = await instance.loginPopup({
        ...microsoftLoginRequest,
        overrideInteractionInProgress: true,
      })
      if (attempt !== attemptRef.current) return
      phaseRef.current = 'exchanging'
      setBusyState(true)
      await loginWithMicrosoft(result.idToken, result.accessToken)
    } catch (error) {
      if (attempt !== attemptRef.current) return
      const silent = error instanceof BrowserAuthError && SILENT_ERRORS.includes(error.errorCode)
      if (!silent) {
        onError(
          error instanceof ApiError
            ? error.message
            : error instanceof BrowserAuthError &&
                (error.errorCode === BrowserAuthErrorCodes.popupWindowError ||
                  error.errorCode === BrowserAuthErrorCodes.emptyWindowError)
              ? 'The sign-in popup was blocked. Allow popups for this site and try again.'
              : 'Could not sign in with Microsoft. Please try again.',
        )
      }
      phaseRef.current = 'idle'
      setBusyState(false)
    }
  }

  return (
    <button
      className="flex h-10.5 w-full cursor-pointer items-center justify-center gap-2.5 rounded-[8px] border border-[#d7dbe6] bg-white text-[14px] font-semibold text-[#3f4045] transition-colors hover:bg-[#f5f7fb] disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled || busy || inProgress === InteractionStatus.Startup}
      onClick={handleClick}
      type="button"
    >
      <MicrosoftLogo />
      {busy ? 'Signing in…' : 'Sign in with Microsoft'}
    </button>
  )
}
