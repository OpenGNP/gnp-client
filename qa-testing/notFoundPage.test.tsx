import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { NotFoundPage } from '../src/pages/NotFoundPage'

function renderAt(entries: string[]) {
  render(
    <MemoryRouter initialEntries={entries} initialIndex={entries.length - 1}>
      <Routes>
        <Route path="/my-forms" element={<p>My forms page</p>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('NotFoundPage', () => {
  it('opened straight from a link: only Back to Home, since back would leave the app', () => {
    renderAt(['/nope'])
    expect(screen.getByText("This page doesn't exist")).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Go back' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to Home' })).toHaveAttribute('href', '/')
  })

  it('reached from inside the app: Go back returns to the previous page', async () => {
    const user = userEvent.setup()
    renderAt(['/my-forms', '/nope'])
    await user.click(screen.getByRole('button', { name: 'Go back' }))
    expect(screen.getByText('My forms page')).toBeInTheDocument()
  })
})
