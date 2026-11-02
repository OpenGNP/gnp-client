import { render, screen } from '@testing-library/react'

import { TopicSentimentCard } from '../src/components/dashboard/TopicSentimentCard'
import type { TopicSentiment } from '../src/data/dashboardAnalytics'

const topic = (id: string, label: string): TopicSentiment => ({
  id,
  label,
  negative: 3,
  neutral: 1,
  positive: 1,
  percentOfTotal: 50,
  aiSummary: '',
  keywords: [],
  feedbackSegment: [],
})

describe('Themes topic list change tags', () => {
  it('tags worse and new topics from What changed, and nothing else', () => {
    render(
      <TopicSentimentCard
        changes={{ current: 'October', previous: 'September', kinds: { '1': 'worse', '2': 'new' } }}
        title="Topics found by AI (3)"
        topics={[topic('1', 'Shift swaps'), topic('2', 'Parking'), topic('3', 'Canteen')]}
      />,
    )
    const rows = screen.getAllByRole('button', { name: /Shift swaps|Parking|Canteen/ })
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringContaining('Shift swapsWorse'),
      expect.stringContaining('ParkingNew'),
      expect.not.stringMatching(/Worse|New/),
    ])
  })
})
