import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'

import { TopicTrendsCard } from '../src/components/dashboard/TopicTrendsCard'

// jsdom has no ResizeObserver (recharts' ResponsiveContainer needs one).
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const series = [
  { id: '1', label: 'Canteen' },
  { id: '2', label: 'Parking' },
]

function Card() {
  const [pinned, setPinned] = useState<string | null>(null)
  return (
    <TopicTrendsCard
      onPinnedTopicChange={setPinned}
      pinnedTopic={pinned}
      sentimentSeries={[]}
      data={[
        { label: 'W1', '1': 3, '2': 5 },
        { label: 'W2', '1': 9, '2': 4 },
      ]}
      sentimentByTopic={{
        '1': [
          { negative: 2, neutral: 1, positive: 0 },
          { negative: 6, neutral: 2, positive: 1 },
        ],
        '2': [
          { negative: 0, neutral: 2, positive: 3 },
          { negative: 1, neutral: 1, positive: 2 },
        ],
      }}
      series={series}
      summaries={[
        { id: '1', mentions: 12, negative: 8, neutral: 3, positive: 1 },
        { id: '2', mentions: 9, negative: 1, neutral: 3, positive: 5 },
      ]}
    />
  )
}

function renderCard() {
  render(<Card />)
}

describe('TopicTrendsCard side panel', () => {
  it('shows whole-period totals and sentiment, biggest topic first', () => {
    renderCard()
    expect(screen.getByText('Whole period')).toBeInTheDocument()
    const rows = screen.getAllByRole('button', { name: /Canteen|Parking/ })
    // One line per topic: name, mentions, (no Δ for the whole period), % negative.
    expect(rows.map((row) => row.textContent)).toEqual(['Canteen1267%', 'Parking911%'])
    expect(within(rows[0]!).getByText('67%')).toBeInTheDocument()
  })

  it('clicking a row pins that topic, clicking again releases it', async () => {
    const user = userEvent.setup()
    renderCard()
    const parking = screen.getByRole('button', { name: /Parking/ })
    expect(parking).toHaveAttribute('aria-pressed', 'false')
    await user.click(parking)
    expect(parking).toHaveAttribute('aria-pressed', 'true')
    await user.click(parking)
    expect(parking).toHaveAttribute('aria-pressed', 'false')
  })
})
