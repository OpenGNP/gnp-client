import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { FeedbackSegmentSection } from '../src/components/dashboard/FeedbackSegmentSection'
import type { FeedbackPoint } from '../src/data/dashboardAnalytics'

const point = (id: string, submittedAt: string): FeedbackPoint => ({
  id,
  sentiment: 'negative',
  quote: `Quote ${id}`,
  originalFeedback: `Quote ${id}`,
  submittedAt,
  demographics: [],
})

const points = [point('jul', '2026-07-31T23:00:00.000Z'), point('aug', '2026-08-15T10:00:00.000Z'), point('sep', '2026-09-01T00:00:00.000Z')]
const aug = { label: 'Aug 2026', from: '2026-08-01T00:00:00.000Z', to: '2026-09-01T00:00:00.000Z' }

describe('feedback narrowed to a What changed period', () => {
  it('keeps only points in [from, to) and shows the period chip', () => {
    render(<FeedbackSegmentSection feedbackSegment={points} period={aug} />)
    expect(screen.getAllByText(/Quote aug/).length).toBeGreaterThan(0)
    expect(screen.queryAllByText(/Quote jul/)).toHaveLength(0)
    expect(screen.queryAllByText(/Quote sep/)).toHaveLength(0) // `to` is exclusive
    expect(screen.getByText('Aug 2026')).toBeInTheDocument()
  })

  it('the chip ✕ asks to show every period', async () => {
    const onClearPeriod = vi.fn()
    render(<FeedbackSegmentSection feedbackSegment={points} onClearPeriod={onClearPeriod} period={aug} />)
    await userEvent.click(screen.getByRole('button', { name: /not just Aug 2026/ }))
    expect(onClearPeriod).toHaveBeenCalled()
  })
})
