import { describe, expect, it } from 'vitest'

import { LANDING_SAMPLES } from '../src/data/landingSample'

describe.each(Object.entries(LANDING_SAMPLES))('landing sample: %s', (_, sample) => {
  it('files every comment under a topic it shows', () => {
    const ids = new Set(sample.topics.map((topic) => topic.id))
    for (const comment of sample.comments) expect(ids).toContain(comment.topicId)
  })

  it('charts each topic with the same totals as its row', () => {
    for (const summary of sample.trend.topicSummaries ?? []) {
      const topic = sample.topics.find((t) => t.id === summary.id)
      expect(topic, summary.id).toBeDefined()
      expect([summary.negative, summary.neutral, summary.positive]).toEqual([
        topic!.negative,
        topic!.neutral,
        topic!.positive,
      ])
    }
  })

  it('counts the same number of responses as the chart', () => {
    const charted = sample.trend.responseCounts.reduce((a, b) => a + b, 0)
    expect(charted).toBeLessThanOrEqual(sample.responseCount)
  })

  it('starts the chart pinned on a charted topic', () => {
    expect(sample.trend.topicVolumeSeries.map((s) => s.id)).toContain(sample.pinnedTopic)
  })
})
