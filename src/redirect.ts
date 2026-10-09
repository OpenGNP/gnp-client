import { broadcastResponseToMainFrame } from '@azure/msal-browser/redirect-bridge'

// Runs inside the MSAL login popup (see src/lib/msal.ts): hands the auth response
// back to the window that opened it, which then closes this popup.
broadcastResponseToMainFrame().catch((error: unknown) => {
  console.error('Microsoft sign-in redirect failed', error)
})
