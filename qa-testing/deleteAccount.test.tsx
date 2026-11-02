import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { queryKeys } from '../src/api/queries'
import { AlertDialogHost } from '../src/components/AlertDialogHost'
import { AuthContext } from '../src/lib/auth'
import { ProfilePage } from '../src/pages/ProfilePage'

const api = vi.hoisted(() => ({
  getDeletionSummary: vi.fn(() => new Promise((resolve) => setTimeout(() => resolve({ forms: 2, responses: 9 }), 20))),
  deleteMyAccount: vi.fn(() => Promise.resolve()),
}))
vi.mock('../src/api/users', async (importOriginal) => ({ ...(await importOriginal<object>()), ...api }))

describe('delete account', () => {
  it('asks once, however fast the button is clicked, and leaves no dialog behind', async () => {
    const user = { id: 1, fullName: 'A', email: 'a@kmutt.ac.th', role: null, organizationId: null }
    const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } })
    client.setQueryData(queryKeys.me, { ...user, organizationName: null })
    client.setQueryData(['me', 'deletion-summary'], { forms: 2, responses: 9 })
    client.setQueryData(queryKeys.sharedForms, [])
    const logout = vi.fn(() => Promise.resolve())
    render(
      <QueryClientProvider client={client}>
        <AuthContext.Provider
          value={{ user, status: 'ready', error: null, retry() {}, async login() {}, async loginWithMicrosoft() {}, logout, signedOut: false }}
        >
          <MemoryRouter>
            <ProfilePage />
            <AlertDialogHost />
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>,
    )

    const button = screen.getByRole('button', { name: /delete account/i })
    fireEvent.click(button)
    fireEvent.click(button)
    await screen.findByText('Delete your account?')
    expect(api.getDeletionSummary).toHaveBeenCalledTimes(1)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'a@kmutt.ac.th' } })
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: 'Delete account' }).at(-1)!)
    })
    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1))
    expect(api.deleteMyAccount).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.queryByText('Delete your account?')).not.toBeInTheDocument())
  })
})
