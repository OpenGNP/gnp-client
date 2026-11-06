// CLI-C-01 / D-06: LoginPage sends a trimmed email, shows API errors, redirects when signed in
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { LoginPage } from '@/pages/LoginPage'
import { ApiError } from '@/lib/api'
import { AuthContext, type AuthContextValue } from '@/lib/auth'

function renderLogin(overrides: Partial<AuthContextValue> = {}, state?: { from: string }) {
  const value: AuthContextValue = {
    user: null,
    status: 'unauthenticated',
    error: null,
    retry: vi.fn(),
    login: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn(),
    ...overrides,
  }
  render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={[{ pathname: '/login', state }]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<div>home page</div>} />
          <Route path="/files" element={<div>files page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
  return value
}

describe('LoginPage', () => {
  it('D-06: submits the email trimmed of surrounding whitespace', async () => {
    const auth = renderLogin()
    const email = screen.getByPlaceholderText('you@example.com') as HTMLInputElement
    // Bypass type=email's own sanitization so the component's trim is what is under test.
    email.setAttribute('type', 'text')
    fireEvent.change(email, { target: { value: '  a@b.com  ' } })
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'secret-pw')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => expect(auth.login).toHaveBeenCalledWith('a@b.com', 'secret-pw'))
  })

  it('shows the server error message on a failed login and stays on the page', async () => {
    renderLogin({ login: vi.fn().mockRejectedValue(new ApiError('Invalid email or password', 401)) })
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'a@b.com')
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument()
  })

  it('shows a generic message for non-API failures', async () => {
    renderLogin({ login: vi.fn().mockRejectedValue(new Error('boom')) })
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'a@b.com')
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'x')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText('Could not sign in. Please try again.')).toBeInTheDocument()
  })

  it('an already signed-in user is redirected to state.from, else home', () => {
    const user = { id: 1, fullName: 'A', email: 'a@b.com', role: 'admin', organizationId: 1 }
    renderLogin({ status: 'ready', user }, { from: '/files' })
    expect(screen.getByText('files page')).toBeInTheDocument()
  })
})
