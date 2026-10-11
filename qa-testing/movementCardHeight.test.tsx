import { render, screen } from '@testing-library/react'

import { TrendView } from '../src/components/dashboard/TrendView'
import type { FormTrendAnalytics, TopicMovement } from '../src/data/dashboardAnalytics'

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const row = (id: string, label: string, delta: number): TopicMovement => ({
  id,
  label,
  currentMentions: 5 + delta,
  previousMentions: 5,
  delta,
  status: 'existing',
  positiveDelta: 0,
  negativeDelta: delta,
})

const base: FormTrendAnalytics = {
  bucket: 'week',
  rank: 'mentioned',
  from: '',
  to: '',
  rangeLabel: '',
  comparisonLabel: 'last 7 days vs the week before',
  totalMentions: 10,
  topicVolumeSeries: [],
  availableTopics: [],
  volumeSeries: [],
  topicSentimentSeries: {},
  topicSummaries: [],
  sentimentSeries: [],
  risingTopics: [row('1', 'Canteen', 6)],
  decliningTopics: [],
  movementRule: { minDelta: 2, limit: 5 },
  emergingIssues: [],
  timelineEvents: [],
}

describe('Rising / Declining short lists', () => {
  it('a short list ends with the same brief note on both cards', () => {
    render(<TrendView trend={base} />)
    expect(screen.getByText('No more topics to show')).toBeInTheDocument() // Rising: 1 row
    expect(screen.getByText('No topics to show')).toBeInTheDocument() // Declining: empty
  })

  it('a full list needs no note', () => {
    const full = [1, 2, 3, 4, 5].map((i) => row(String(i), `Topic ${i}`, 10 - i))
    render(<TrendView trend={{ ...base, risingTopics: full }} />)
    expect(screen.queryByText('No more topics to show')).not.toBeInTheDocument()
  })
})
