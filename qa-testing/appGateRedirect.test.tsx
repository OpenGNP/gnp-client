import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'

import { AppGate } from '../src/components/AppGate'
import { AuthContext, type AuthContextValue } from '../src/lib/auth'

function LoginProbe() {
  const from = (useLocation().state as { from?: string } | null)?.from
  return <p>login from={from ?? 'none'}</p>
}

function renderSignedOutAt(path: string, signedOut: boolean) {
  const auth: AuthContextValue = {
    user: null,
    status: 'unauthenticated',
    error: null,
    retry: () => {},
    login: async () => {},
    loginWithMicrosoft: async () => {},
    logout: async () => {},
    signedOut,
  }
  render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<LoginProbe />} />
          <Route path="*" element={<AppGate><p>app</p></AppGate>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('AppGate sign-in redirect', () => {
  it('remembers the page for a signed-out deep link', () => {
    renderSignedOutAt('/forms/4/dashboard', false)
    expect(screen.getByText('login from=/forms/4/dashboard')).toBeInTheDocument()
  })

  it('forgets the page after an explicit log out, so sign-in lands on Home', () => {
    renderSignedOutAt('/forms/4/dashboard', true)
    expect(screen.getByText('login from=none')).toBeInTheDocument()
  })
})
