import { PublicClientApplication, type PopupRequest } from '@azure/msal-browser'

const clientId = import.meta.env.VITE_MSAL_CLIENT_ID
const tenantId = import.meta.env.VITE_MSAL_TENANT_ID || 'common'

/**
 * The single MSAL instance, or `null` when VITE_MSAL_CLIENT_ID isn't set — the
 * login page then just hides the "Sign in with Microsoft" button.
 *
 * Popup flow: the popup lands on /redirect.html (a blank page running MSAL's
 * redirect bridge, see src/redirect.ts) rather than the app itself, so the SPA
 * never boots inside the popup. That URI must be registered as a "Single-page
 * application" redirect URI on the Entra app registration.
 */
export const msalInstance = clientId
  ? new PublicClientApplication({
      auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        redirectUri: `${window.location.origin}/redirect.html`,
        postLogoutRedirectUri: window.location.origin,
      },
      cache: { cacheLocation: 'sessionStorage' },
    })
  : null

/**
 * The ID token is what the server verifies to sign in. `User.Read` (user-consentable)
 * additionally yields a Graph access token the server uses to read the tenant's
 * display name when it creates a new organization.
 */
export const microsoftLoginRequest: PopupRequest = {
  scopes: ['openid', 'profile', 'email', 'User.Read'],
  prompt: 'select_account',
}
