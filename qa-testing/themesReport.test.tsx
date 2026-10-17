import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { FormThemeAnalytics } from '../src/api/analytics'
import type { FeedbackPoint, TopicSentiment } from '../src/data/dashboardAnalytics'
import { ThemesReport } from '../src/components/report/ThemesReport'

const point = (id: string, quote: string, sentiment: FeedbackPoint['sentiment'], violation = false): FeedbackPoint => ({
  id,
  quote,
  originalFeedback: quote,
  sentiment,
  violation,
  submittedAt: '2026-10-01T00:00:00Z',
  respondentName: 'Somchai',
  demographics: [],
})

const topic = (id: string, label: string, points: FeedbackPoint[]) =>
  ({
    id,
    label,
    negative: points.filter((p) => p.sentiment === 'negative').length,
    neutral: points.filter((p) => p.sentiment === 'neutral').length,
    positive: points.filter((p) => p.sentiment === 'positive').length,
    percentOfTotal: 50,
    hasViolation: points.some((p) => p.violation),
    aiSummary: `Summary of ${label}`,
    keywords: [],
    feedbackSegment: points,
  }) as unknown as TopicSentiment

const facilities = topic('1', 'Facilities', [
  point('a', 'WiFi is fine', 'positive'),
  point('b', 'Lecturer took a bribe', 'negative', true),
  point('c', 'Air con too cold', 'negative'),
])

const themes = {
  rangeLabel: '1 Sep – 17 Oct 2026',
  totalResponders: 3,
  sentiment: { score: 2, outOf: 5, negative: 2, neutral: 0, positive: 1 },
  violationTopics: [facilities],
  aiDiscoveredTopics: [facilities, topic('uncategorised', 'Uncategorised feedback', [point('d', 'misc', 'neutral')])],
} as unknown as FormThemeAnalytics

describe('ThemesReport', () => {
  it('summarises topics, puts flagged quotes first and never prints names', () => {
    const { container } = render(<ThemesReport formTitle="Canteen survey" scope={['Year = 4']} sort="priority" themes={themes} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Canteen survey' })).toBeInTheDocument()
    expect(screen.getByText('Year = 4')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Top topic by priority' })).toBeInTheDocument()
    const quotes = [...container.querySelectorAll('li')].map((li) => li.textContent)
    expect(quotes[0]).toContain('Lecturer took a bribe')
    expect(container.textContent).not.toContain('Somchai')
  })

  it('picks the top topics by the chosen order, not violations first', () => {
    const busy = topic('2', 'Canteen', [
      point('e', 'Queues are long', 'negative'),
      point('f', 'Food is cold', 'negative'),
      point('g', 'Prices went up', 'negative'),
      point('h', 'Too few seats', 'negative'),
    ])
    const many = { ...themes, aiDiscoveredTopics: [facilities, busy] } as FormThemeAnalytics
    render(<ThemesReport formTitle="Canteen survey" scope={[]} sort="mentions" themes={many} />)
    const headings = screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)
    // The top-topic cards come first, ahead of the violations section's headings.
    expect(headings.slice(0, 2)).toEqual(['Canteen', 'Facilities'])
  })
})
