import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { PrivacyPage, TermsPage } from '../src/pages/LegalPage'

function renderAt(Page: () => React.JSX.Element, path = '/') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Page />
    </MemoryRouter>,
  )
}

const hrefs = (name: string) => screen.getAllByRole('link', { name }).map((link) => link.getAttribute('href'))

describe('legal pages', () => {
  it.each([
    ['Terms of Use', TermsPage],
    ['Privacy Notice', PrivacyPage],
  ])('%s renders without signing in and links to both pages', (title, Page) => {
    renderAt(Page)
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument()
    expect(hrefs('Terms of Use')).toEqual(['/terms'])
    expect(hrefs('Privacy Notice')).toEqual(['/privacy'])
    expect(hrefs('Back to GNP')).toEqual(['/', '/'])
  })

  it('from a form, goes back to that form (a respondent has no account to sign in to)', () => {
    renderAt(PrivacyPage, '/privacy?from=%2Ff%2Fabc-123')
    expect(hrefs('Back to the form')).toEqual(['/f/abc-123', '/f/abc-123'])
    expect(hrefs('Terms of Use')).toEqual(['/terms?from=%2Ff%2Fabc-123'])
  })

  it('ignores a `from` that isn\'t one of our form links', () => {
    renderAt(PrivacyPage, '/privacy?from=https%3A%2F%2Fevil.example')
    expect(hrefs('Back to GNP')).toEqual(['/', '/'])
  })
})
