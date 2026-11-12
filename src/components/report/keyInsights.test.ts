import { describe, expect, it } from 'vitest'

import type { FormThemeAnalytics } from '../../api/analytics'
import { keyInsights } from './keyInsights'

// Only what keyInsights reads.
const topic = (id: string, negative: number, positive: number, hasViolation = false) => ({
  id,
  label: id,
  negative,
  neutral: 0,
  positive,
  hasViolation,
  feedbackSegment: [],
})
const themes = (topics: ReturnType<typeof topic>[]) =>
  ({
    aiDiscoveredTopics: topics,
    sentiment: {
      negative: topics.reduce((sum, t) => sum + t.negative, 0),
      neutral: 0,
      positive: topics.reduce((sum, t) => sum + t.positive, 0),
    },
  }) as unknown as FormThemeAnalytics
const keep = (t: FormThemeAnalytics) => keyInsights(t).find((insight) => insight.kind === 'keep')

describe('keyInsights keep doing', () => {
  it('skips topics with more negative than positive, even with the most praise', () => {
    expect(keep(themes([topic('curriculum', 29, 18), topic('buddy', 1, 5)]))?.topicId).toBe('buddy')
  })

  it('skips topics with a violation', () => {
    expect(keep(themes([topic('lead', 1, 20, true), topic('buddy', 1, 5)]))?.topicId).toBe('buddy')
  })

  it('shows no keep doing when no topic qualifies', () => {
    expect(keep(themes([topic('curriculum', 29, 18), topic('lead', 1, 20, true)]))).toBeUndefined()
  })
})
