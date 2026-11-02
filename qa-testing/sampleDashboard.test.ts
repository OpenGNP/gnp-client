import { describe, expect, it } from 'vitest'

import { SAMPLE_INDIVIDUAL, SAMPLE_RESPONSES, SAMPLE_THEMES } from '../src/data/sampleDashboard'

describe('sample responses', () => {
  it('has one Individual entry per response, adding up to the Response tab', () => {
    expect(SAMPLE_INDIVIDUAL.responses).toHaveLength(SAMPLE_RESPONSES.totalResponses)
    const tally = (fieldId: number, label: string) =>
      SAMPLE_INDIVIDUAL.responses.filter((response) => response.answers[fieldId]?.includes(label)).length
    const [department, shift] = SAMPLE_RESPONSES.demographic
    const used = SAMPLE_RESPONSES.feedback[0]!
    for (const option of department!.options) expect(tally(1, option.label)).toBe(option.value)
    for (const option of shift!.options) expect(tally(2, option.label)).toBe(option.value)
    if (used.kind === 'multi-choice') for (const option of used.options) expect(tally(3, option.label)).toBe(option.value)
    expect(new Set(SAMPLE_INDIVIDUAL.responses.map((response) => response.respondentName)).size).toBe(SAMPLE_RESPONSES.totalResponses)
  })
})

describe('sample themes', () => {
  it('builds every mention from a response, keeping the landing numbers', () => {
    const ids = new Set(SAMPLE_INDIVIDUAL.responses.map((response) => response.id))
    for (const topic of SAMPLE_THEMES.aiDiscoveredTopics) {
      expect(topic.feedbackSegment).toHaveLength(topic.negative + topic.neutral + topic.positive)
      for (const point of topic.feedbackSegment) {
        expect(ids.has(point.submissionId!)).toBe(true)
        const response = SAMPLE_INDIVIDUAL.responses.find((r) => r.id === point.submissionId)!
        expect(response.answers[4]?.[0]).toContain(point.quote)
      }
    }
    const shift = SAMPLE_THEMES.aiDiscoveredTopics.find((topic) => topic.id === 'shift')!
    expect([shift.negative, shift.neutral, shift.positive]).toEqual([31, 8, 3])
    const flagged = SAMPLE_THEMES.aiDiscoveredTopics.flatMap((topic) => topic.feedbackSegment).filter((p) => p.violation)
    expect(flagged).toHaveLength(3)
  })
})
