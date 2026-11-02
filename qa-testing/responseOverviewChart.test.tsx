import { fireEvent, render, screen } from '@testing-library/react'

import { ResponseOverviewSection } from '../src/components/dashboard/ResponseOverviewSection'

const singleChoice = (count: number) => ({
  kind: 'single-choice' as const,
  id: 'q',
  title: 'Department',
  options: Array.from({ length: count }, (_, i) => ({ id: String(i), label: `Dept ${i + 1}`, value: i + 1 })),
})

describe('ResponseOverviewSection', () => {
  it('keeps a pie while each option has its own colour', () => {
    render(<ResponseOverviewSection breakdowns={[singleChoice(6)]} title="Demographic overview" />)
    expect(screen.getByRole('img', { name: 'Department breakdown' })).toBeInTheDocument()
  })

  it('switches to bars once colours would repeat, without the multi-choice note', () => {
    render(<ResponseOverviewSection breakdowns={[singleChoice(7)]} title="Demographic overview" />)
    expect(screen.queryByRole('img', { name: 'Department breakdown' })).not.toBeInTheDocument()
    expect(screen.getByText('28 responses')).toBeInTheDocument()
    expect(screen.getByText('7 (25%)')).toBeInTheDocument()
  })

  it('links to Individual search only once answers run past one page', () => {
    const text = (count: number) => ({
      kind: 'text' as const,
      id: 't',
      title: 'Anything else?',
      responses: Array.from({ length: count }, (_, i) => `Answer ${i + 1}`),
    })
    const onSearchAll = vi.fn()
    const { rerender } = render(
      <ResponseOverviewSection breakdowns={[text(10)]} onSearchAll={onSearchAll} title="Feedback overview" />,
    )
    expect(screen.getByText('Answer 10')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /search all in individual/i })).not.toBeInTheDocument()

    rerender(<ResponseOverviewSection breakdowns={[text(11)]} onSearchAll={onSearchAll} title="Feedback overview" />)
    fireEvent.click(screen.getByRole('button', { name: /search all in individual/i }))
    expect(onSearchAll).toHaveBeenCalled()
  })
})
