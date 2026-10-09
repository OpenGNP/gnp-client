import { MsalProvider } from '@azure/msal-react'
import type { ReactNode } from 'react'

import { msalInstance } from '../lib/msal'

/** Microsoft sign-in is optional — without VITE_MSAL_CLIENT_ID there's no instance to provide. */
export function MaybeMsalProvider({ children }: { children: ReactNode }) {
  return msalInstance ? <MsalProvider instance={msalInstance}>{children}</MsalProvider> : children
}
