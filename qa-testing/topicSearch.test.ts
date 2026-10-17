import { describe, expect, it } from 'vitest'

import type { FeedbackPoint, TopicSentiment } from '../src/data/dashboardAnalytics'
import { searchTopics } from '../src/components/dashboard/topicSearch'

const point = (quote: string, originalFeedback = quote): FeedbackPoint => ({
  id: quote,
  sentiment: 'negative',
  quote,
  originalFeedback,
  submittedAt: '2026-10-01T00:00:00Z',
  demographics: [],
})

const topic = (id: string, label: string, keywords: string[], points: FeedbackPoint[]) =>
  ({
    id,
    label,
    keywords: keywords.map((text) => ({ text, weight: 1 })),
    feedbackSegment: points,
  }) as unknown as TopicSentiment

const topics = [
  topic('facilities', 'Facilities', ['wifi'], [point('แอร์เย็นเกินไป'), point('Slow WiFi', 'The WiFi in building 4 is slow')]),
  topic('teaching', 'Teaching quality', [], [point('Lectures are clear', 'Lectures are clear but the แอร์ is loud')]),
]

describe('searchTopics', () => {
  it('is null without a query', () => {
    expect(searchTopics(topics, ' ')).toBeNull()
  })

  it('matches by name or keyword with zero feedback matches', () => {
    expect([...searchTopics(topics, 'teaching')!]).toEqual([['teaching', { feedbackCount: 0, snippet: null }]])
    expect(searchTopics(topics, 'wifi')!.get('facilities')).toEqual({ feedbackCount: 1, snippet: 'Slow WiFi' })
  })

  it('counts feedback matches in the quote or the original text, with a snippet of the first', () => {
    const matches = searchTopics(topics, 'แอร์')!
    expect(matches.get('facilities')).toEqual({ feedbackCount: 1, snippet: 'แอร์เย็นเกินไป' })
    expect(matches.get('teaching')).toEqual({ feedbackCount: 1, snippet: 'Lectures are clear but the แอร์ is loud' })
  })
})
