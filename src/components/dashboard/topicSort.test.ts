import { describe, expect, it } from 'vitest'

import type { TopicSentiment } from '../../data/dashboardAnalytics'
import { sortTopics } from './topicSort'

// Only what sorting reads.
const topic = (id: string, negative: number, violations: number) =>
  ({
    id,
    negative,
    neutral: 0,
    positive: 0,
    hasViolation: violations > 0,
    feedbackSegment: Array.from({ length: violations }, () => ({ violation: true })),
  }) as unknown as TopicSentiment

describe('sortTopics priority', () => {
  it('puts violation topics first, then most negative, whatever the violation count', () => {
    const order = sortTopics([topic('canteen', 50, 1), topic('grading', 10, 8), topic('wifi', 90, 0)], 'priority')
    expect(order.map((t) => t.id)).toEqual(['canteen', 'grading', 'wifi'])
  })

  it('leaves other orders alone', () => {
    const order = sortTopics([topic('canteen', 50, 1), topic('grading', 10, 8)], 'negative')
    expect(order.map((t) => t.id)).toEqual(['canteen', 'grading'])
  })
})
