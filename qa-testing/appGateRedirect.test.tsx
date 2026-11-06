import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'

import { AppGate } from '../src/components/AppGate'
import { LandingPage } from '../src/pages/LandingPage'
import { AuthContext, postSignInPath, type AuthContextValue, type AuthUser } from '../src/lib/auth'

// The landing page loads its sample dashboard through React Query.
const withQueryClient = (ui: ReactNode) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>
)

function LoginProbe() {
  const state = useLocation().state as { from?: string; forUserId?: number | null } | null
  const forUser = state?.forUserId != null ? ` for=${state.forUserId}` : ''
  return (
    <p>
      login from={state?.from ?? 'none'}
      {forUser}
    </p>
  )
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
    withQueryClient(
      <AuthContext.Provider value={auth}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/login" element={<LoginProbe />} />
            <Route path="*" element={<AppGate><p>app</p></AppGate>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    ),
  )
}

describe('AppGate sign-in redirect', () => {
  afterEach(() => window.localStorage.clear())

  it('remembers the page for a signed-out deep link', () => {
    renderSignedOutAt('/forms/4/dashboard', false)
    expect(screen.getByText('login from=/forms/4/dashboard')).toBeInTheDocument()
  })

  it('shows the landing page at / instead of redirecting', () => {
    renderSignedOutAt('/', false)
    expect(screen.getByRole('heading', { level: 1, name: /turn every open answer into a short list of what to fix/i })).toBeInTheDocument()
    expect(screen.queryByText(/^login from=/)).not.toBeInTheDocument()
  })

  it('offers Home instead of sign-in on /about when signed in', () => {
    const auth = { status: 'ready', user: null, signedOut: false } as unknown as AuthContextValue
    render(
      withQueryClient(
        <AuthContext.Provider value={auth}>
          <MemoryRouter initialEntries={['/about']}>
            <LandingPage />
          </MemoryRouter>
        </AuthContext.Provider>,
      ),
    )
    expect(screen.getAllByRole('link', { name: /go to home/i }).length).toBeGreaterThan(0)
    expect(screen.queryByText(/sign in with microsoft/i)).not.toBeInTheDocument()
  })

  it('forgets the page after an explicit log out, so sign-in lands on Home', () => {
    renderSignedOutAt('/forms/4/dashboard', true)
    expect(screen.getByText('login from=none')).toBeInTheDocument()
  })

  it('tags the remembered page with whoever last signed in on this browser', () => {
    window.localStorage.setItem('gnp.auth.lastUserId', '7')
    renderSignedOutAt('/forms/4/dashboard', false)
    expect(screen.getByText('login from=/forms/4/dashboard for=7')).toBeInTheDocument()
  })
})

describe('postSignInPath', () => {
  const user = (id: number): AuthUser => ({
    id,
    fullName: null,
    email: `u${id}@example.com`,
    role: 'admin',
    organizationId: 1,
  })

  it('returns to the page for the same account', () => {
    expect(postSignInPath({ from: '/forms/4/dashboard', forUserId: 7 }, user(7))).toBe('/forms/4/dashboard')
  })

  it('sends a different account Home', () => {
    expect(postSignInPath({ from: '/forms/4/dashboard', forUserId: 7 }, user(9))).toBe('/')
  })

  it('honours a shared link when nobody signed in here before', () => {
    expect(postSignInPath({ from: '/forms/4/dashboard', forUserId: null }, user(9))).toBe('/forms/4/dashboard')
    expect(postSignInPath({ from: '/f/tok123' }, user(9))).toBe('/f/tok123')
  })

  it('defaults to Home with no remembered page', () => {
    expect(postSignInPath(null, user(9))).toBe('/')
  })
})
