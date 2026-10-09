import { BrowserAuthError, BrowserAuthErrorCodes, InteractionStatus } from '@azure/msal-browser'
import { useMsal } from '@azure/msal-react'
import { useState } from 'react'

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

/** Popup sign-in via MSAL; the resulting ID token is exchanged for an app session. */
export function MicrosoftSignInButton({ disabled, onBusyChange, onError }: MicrosoftSignInButtonProps) {
  const { instance, inProgress } = useMsal()
  const { loginWithMicrosoft } = useAuth()
  const [busy, setBusy] = useState(false)

  async function handleClick() {
    if (busy) return
    onError('')
    setBusy(true)
    onBusyChange(true)
    try {
      const result = await instance.loginPopup(microsoftLoginRequest)
      await loginWithMicrosoft(result.idToken, result.accessToken)
    } catch (error) {
      // Closing the popup / double-clicking isn't an error worth showing.
      const silent =
        error instanceof BrowserAuthError &&
        (error.errorCode === BrowserAuthErrorCodes.userCancelled ||
          error.errorCode === BrowserAuthErrorCodes.interactionInProgress)
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
      setBusy(false)
      onBusyChange(false)
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
