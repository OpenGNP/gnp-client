import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'

import { TrendView } from '../src/components/dashboard/TrendView'
import type { FormTrendAnalytics } from '../src/data/dashboardAnalytics'

// The pinned topic lives on the page; give TrendView the same state here.
function PinnableTrendView({ trend }: { trend: FormTrendAnalytics }) {
  const [pinned, setPinned] = useState<string | null>(null)
  return <TrendView onPinnedChange={setPinned} pinned={pinned} trend={trend} />
}

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const trend: FormTrendAnalytics = {
  bucket: 'week',
  rank: 'mentioned',
  from: '',
  to: '',
  rangeLabel: '',
  totalMentions: 20,
  topicVolumeSeries: [{ id: '1', label: 'Canteen' }],
  availableTopics: [],
  volumeSeries: [
    { label: 'W1', '1': 2 },
    { label: 'W2', '1': 4 },
  ],
  topicSentimentSeries: {
    '1': [
      { negative: 1, neutral: 1, positive: 0 },
      { negative: 3, neutral: 0, positive: 1 },
    ],
  },
  topicSummaries: [{ id: '1', mentions: 6, negative: 4, neutral: 1, positive: 1 }],
  // Whole-form sentiment, deliberately different from Canteen's.
  sentimentSeries: [
    { label: 'W1', negative: 10, neutral: 40, positive: 50, counts: { negative: 2, neutral: 8, positive: 10 } },
    { label: 'W2', negative: 20, neutral: 30, positive: 50, counts: { negative: 4, neutral: 6, positive: 10 } },
  ],
  timelineEvents: [],
}

describe('the sentiment strip in Topic Trends follows the focused topic', () => {
  const strip = (name: string) => screen.getByRole('img', { name: `Sentiment for ${name}` })

  it('shows all topics until a topic is pinned, then that topic, then back', async () => {
    const user = userEvent.setup()
    render(<PinnableTrendView trend={trend} />)
    expect(strip('all topics')).toBeInTheDocument()

    const canteen = screen.getByRole('button', { name: /Canteen/ })
    await user.click(canteen)
    expect(strip('Canteen')).toBeInTheDocument()
    // Pinned: it stays after the pointer leaves.
    await user.unhover(canteen)
    expect(strip('Canteen')).toBeInTheDocument()

    // Unpin, then move away (while the pointer is on the row it still previews it).
    await user.click(canteen)
    await user.unhover(canteen)
    expect(strip('all topics')).toBeInTheDocument()
  })

  it('hovering a topic row previews it, leaving the list restores all topics', async () => {
    const user = userEvent.setup()
    render(<PinnableTrendView trend={trend} />)
    const canteen = screen.getByRole('button', { name: /Canteen/ })
    await user.hover(canteen)
    expect(strip('Canteen')).toBeInTheDocument()
    await user.unhover(canteen)
    expect(strip('all topics')).toBeInTheDocument()
  })

  it('the All topics row totals the whole form', () => {
    render(<PinnableTrendView trend={trend} />)
    // 20 + 20 mentions across the two periods, 6 of them negative → 15%.
    // ("All topics" also labels the sentiment strip; find the panel row by its cells.)
    const rowTexts = screen.getAllByText('All topics').map((el) => el.parentElement?.textContent)
    expect(rowTexts).toContain('All topics4015%')
  })

  it('while a topic is pinned, hovering another topic does not change the focus', async () => {
    const twoTopics: FormTrendAnalytics = {
      ...trend,
      topicVolumeSeries: [
        { id: '1', label: 'Canteen' },
        { id: '2', label: 'Parking' },
      ],
      volumeSeries: [
        { label: 'W1', '1': 2, '2': 1 },
        { label: 'W2', '1': 4, '2': 1 },
      ],
      topicSentimentSeries: {
        ...trend.topicSentimentSeries,
        '2': [
          { negative: 0, neutral: 1, positive: 0 },
          { negative: 0, neutral: 0, positive: 1 },
        ],
      },
      topicSummaries: [
        ...trend.topicSummaries,
        { id: '2', mentions: 2, negative: 0, neutral: 1, positive: 1 },
      ],
    }
    const user = userEvent.setup()
    render(<PinnableTrendView trend={twoTopics} />)
    await user.click(screen.getByRole('button', { name: /Canteen/ }))
    await user.hover(screen.getByRole('button', { name: /Parking/ }))
    expect(strip('Canteen')).toBeInTheDocument()
    // Clicking the other topic moves the pin.
    await user.click(screen.getByRole('button', { name: /Parking/ }))
    expect(strip('Parking')).toBeInTheDocument()
  })
})
