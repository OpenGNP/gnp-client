import { describe, expect, it } from 'vitest'

import { SAMPLE_INDIVIDUAL, SAMPLE_RESPONSES, SAMPLE_THEMES } from '../src/data/sampleDashboard'

describe('demo snapshot', () => {
  it('has one Individual entry per response', () => {
    expect(SAMPLE_INDIVIDUAL.responses).toHaveLength(SAMPLE_RESPONSES.totalResponses)
  })

  it('ties every mention to a response, with counts matching its topic', () => {
    const ids = new Set(SAMPLE_INDIVIDUAL.responses.map((response) => response.id))
    for (const topic of SAMPLE_THEMES.aiDiscoveredTopics) {
      expect(topic.feedbackSegment).toHaveLength(topic.negative + topic.neutral + topic.positive)
      for (const point of topic.feedbackSegment) expect(ids.has(point.submissionId!)).toBe(true)
    }
  })
})
