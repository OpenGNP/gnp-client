import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AxiosAdapter } from 'axios'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'

import { AppGate } from '../src/components/AppGate'
import { AuthProvider } from '../src/components/AuthProvider'
import { apiGet, getAuthToken, httpClient, setAuthToken } from '../src/lib/api'

// /users/me succeeds (signed in), then any other call answers 401 — the token
// "expired while the page was open".
const adapter: AxiosAdapter = async (config) => {
  const ok = config.url === '/users/me'
  const response = {
    data: ok
      ? { success: true, message: 'ok', data: { id: 7, fullName: 'A', email: 'a@x.com', role: 'admin', organizationId: 1 } }
      : { success: false, message: 'Unauthorized' },
    status: ok ? 200 : 401,
    statusText: ok ? 'OK' : 'Unauthorized',
    headers: {},
    config,
  }
  if (ok) return response
  const { AxiosError } = await import('axios')
  throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, null, response)
}

function Dashboard() {
  return (
    <button onClick={() => void apiGet('/forms/4').catch(() => {})} type="button">
      load
    </button>
  )
}

function LoginProbe() {
  const state = useLocation().state as { from?: string } | null
  return <p>login from={state?.from ?? 'none'}</p>
}

describe('token expiring mid-use', () => {
  beforeEach(() => {
    httpClient.defaults.adapter = adapter
    setAuthToken('expired-soon')
  })
  afterEach(() => {
    setAuthToken(null)
    window.localStorage.clear()
  })

  it('a 401 on any request signs out and returns to /login, remembering the page', async () => {
    const user = userEvent.setup()
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/forms/4/dashboard']}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginProbe />} />
              <Route path="*" element={<AppGate><Dashboard /></AppGate>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    )
    await user.click(await screen.findByRole('button', { name: 'load' }))
    expect(await screen.findByText('login from=/forms/4/dashboard')).toBeInTheDocument()
    await waitFor(() => expect(getAuthToken()).toBeNull())
  })
})
