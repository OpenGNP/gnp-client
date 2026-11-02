import { BrowserAuthError, BrowserAuthErrorCodes, InteractionStatus } from '@azure/msal-browser'
import { useMsal } from '@azure/msal-react'
import { Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { ApiError } from '../lib/api'
import { cn } from '../lib/utils'
import { useAuth } from '../lib/auth'
import { microsoftLoginRequest } from '../lib/msal'

type MicrosoftSignInButtonProps = {
  disabled?: boolean
  /** `primary`: the page's main action (Action Blue, logo on a white tile). Default: Microsoft's own white button. */
  variant?: 'default' | 'primary'
  /** Merged last, e.g. a white focus ring on a blue background. */
  className?: string
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
export function MicrosoftSignInButton({ disabled, variant = 'default', className, onBusyChange, onError }: MicrosoftSignInButtonProps) {
  const { instance, inProgress } = useMsal()
  const { loginWithMicrosoft } = useAuth()
  const [busy, setBusy] = useState(false)
  const attemptRef = useRef(0)
  const phaseRef = useRef<'idle' | 'popup' | 'exchanging'>('idle')
  // What the button says while busy: waiting on the popup, then on our server, which on
  // a first sign-in also sets the account up (a few seconds) — say so, so it isn't a hang.
  const [label, setLabel] = useState('')
  const slowTimer = useRef(0)

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
    setLabel('Continue in the Microsoft window…')
    setBusyState(true)
    try {
      const result = await instance.loginPopup({
        ...microsoftLoginRequest,
        overrideInteractionInProgress: true,
      })
      if (attempt !== attemptRef.current) return
      phaseRef.current = 'exchanging'
      setLabel('Signing you in…')
      window.clearTimeout(slowTimer.current)
      slowTimer.current = window.setTimeout(() => setLabel('Setting up your account…'), 2500)
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
    } finally {
      window.clearTimeout(slowTimer.current)
    }
  }

  useEffect(() => () => window.clearTimeout(slowTimer.current), [])

  return (
    <button
      aria-busy={busy || undefined}
      className={cn(
        'flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-[10px] border font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e55c5] disabled:cursor-not-allowed',
        variant === 'primary'
          ? 'h-12 border-transparent bg-[#1e55c5] text-[16px] text-white hover:bg-[#1a49aa]'
          : 'h-10.5 border-[#d7dbe6] bg-white text-[14px] text-[#3f4045] hover:bg-[#f5f7fb]',
        // Busy is "working", not "unavailable": full strength, with the spinner.
        busy
          ? cn('disabled:opacity-100', variant === 'default' && 'border-[#1e55c5] text-[#1e55c5]')
          : 'disabled:opacity-60',
        className,
      )}
      disabled={disabled || busy || inProgress === InteractionStatus.Startup}
      onClick={handleClick}
      type="button"
    >
      {busy ? (
        <Loader2 className="animate-spin motion-reduce:animate-none" size={18} />
      ) : variant === 'primary' ? (
        // The logo keeps its own colours on a white tile, as Microsoft's brand rules ask.
        <span className="flex size-6 items-center justify-center rounded-[5px] bg-white">
          <MicrosoftLogo />
        </span>
      ) : (
        <MicrosoftLogo />
      )}
      <span aria-live="polite">{busy ? label : 'Sign in with Microsoft'}</span>
    </button>
  )
}
