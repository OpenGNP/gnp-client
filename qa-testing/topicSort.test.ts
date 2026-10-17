import { describe, expect, it } from 'vitest'

import type { TopicSentiment } from '../src/data/dashboardAnalytics'
import { sortTopics } from '../src/components/dashboard/topicSort'

const topic = (id: string, negative: number, positive: number, hasViolation = false) =>
  ({ id, negative, neutral: 0, positive, hasViolation }) as unknown as TopicSentiment

const topics = [
  topic('uncategorised', 50, 50),
  topic('quiet-violation', 1, 0, true),
  topic('busy', 3, 20),
  topic('negative', 9, 0),
]
const ids = (list: TopicSentiment[]) => list.map((t) => t.id)

describe('sortTopics', () => {
  it('puts violation topics first only for Priority', () => {
    expect(ids(sortTopics(topics, 'priority'))).toEqual(['quiet-violation', 'negative', 'busy', 'uncategorised'])
  })

  it('follows the chosen order exactly otherwise, uncategorised still last', () => {
    expect(ids(sortTopics(topics, 'negative'))).toEqual(['negative', 'busy', 'quiet-violation', 'uncategorised'])
    expect(ids(sortTopics(topics, 'mentions'))).toEqual(['busy', 'negative', 'quiet-violation', 'uncategorised'])
    expect(ids(sortTopics(topics, 'positive'))).toEqual(['busy', 'negative', 'quiet-violation', 'uncategorised'])
  })

  it('can drop the violation pin even for Priority', () => {
    expect(ids(sortTopics(topics, 'priority', { pinViolations: false }))).toEqual([
      'negative',
      'busy',
      'quiet-violation',
      'uncategorised',
    ])
  })
})
