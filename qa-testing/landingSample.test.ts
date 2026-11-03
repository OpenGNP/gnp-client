import { describe, expect, it } from 'vitest'

import { LANDING_SAMPLES } from '../src/data/landingSample'

describe.each(Object.entries(LANDING_SAMPLES))('landing sample: %s', (_, sample) => {
  it('files every comment under a topic it shows', () => {
    const ids = new Set(sample.topics.map((topic) => topic.id))
    for (const comment of sample.comments) expect(ids).toContain(comment.topicId)
  })

  it('shows a flagged mention and starts its answers on different topics', () => {
    expect(sample.flaggedPoint.violation).toBe(true)
    const first = sample.comments.slice(0, sample.topics.length).map((comment) => comment.topicId)
    expect(new Set(first).size).toBe(sample.topics.length)
  })

  it('has a summary for every topic the hero lists, new ones included', () => {
    const ids = [
      ...sample.topics.map((topic) => topic.id),
      ...sample.whatChanged.rows.filter((row) => row.kind === 'new').map((row) => row.id),
    ]
    for (const id of ids) expect(sample.topicSummaries[id], id).toBeTruthy()
  })
})
