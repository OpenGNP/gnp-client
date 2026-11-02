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
  it('puts the topic with more violations first, even with fewer negatives', () => {
    const order = sortTopics([topic('canteen', 50, 1), topic('grading', 10, 8), topic('wifi', 90, 0)], 'priority')
    expect(order.map((t) => t.id)).toEqual(['grading', 'canteen', 'wifi'])
  })

  it('breaks a violation tie on negatives', () => {
    const order = sortTopics([topic('a', 5, 2), topic('b', 9, 2)], 'priority')
    expect(order.map((t) => t.id)).toEqual(['b', 'a'])
  })

  it('leaves other orders alone', () => {
    const order = sortTopics([topic('canteen', 50, 1), topic('grading', 10, 8)], 'negative')
    expect(order.map((t) => t.id)).toEqual(['canteen', 'grading'])
  })
})
