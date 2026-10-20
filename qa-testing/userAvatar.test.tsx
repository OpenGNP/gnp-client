import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { UserAvatar } from '../src/components/UserAvatar'

describe('UserAvatar', () => {
  it('shows the Microsoft photo when there is one', () => {
    const { container } = render(<UserAvatar avatarUrl="/users/7/avatar?v=abc" email="s@kmutt.ac.th" name="Somchai Jaidee" />)
    expect(container.querySelector('img')?.getAttribute('src')).toMatch(/\/users\/7\/avatar\?v=abc$/)
  })

  it('shows initials without a photo, or the email letter without a name', () => {
    render(<UserAvatar email="s@kmutt.ac.th" name="Somchai Jaidee" />)
    expect(screen.getByText('SJ')).toBeInTheDocument()
    render(<UserAvatar email="nida@kmutt.ac.th" name={null} />)
    expect(screen.getByText('N')).toBeInTheDocument()
  })

  it('falls back to initials if the photo fails to load', () => {
    const { container } = render(<UserAvatar avatarUrl="/users/7/avatar?v=abc" email="s@kmutt.ac.th" name="Somchai Jaidee" />)
    fireEvent.error(container.querySelector('img')!)
    expect(screen.getByText('SJ')).toBeInTheDocument()
  })
})
