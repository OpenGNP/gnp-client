import type { TopicSentiment } from '../../data/dashboardAnalytics'
import { includesNeedle, snippetOf, toNeedle } from '../../lib/textSearch'

export type TopicMatch = {
  /** How many of the topic's feedback points mention the query (0: matched by name or keyword only). */
  feedbackCount: number
  /** An excerpt of the first matching feedback, around the match. */
  snippet: string | null
}

/**
 * Topics matching `query` by name, keyword or feedback text. `null` when there's no
 * search (show every topic). Respondent names aren't searched here — the topic
 * panel's own search handles those.
 */
export function searchTopics(topics: TopicSentiment[], query: string): Map<string, TopicMatch> | null {
  const needle = toNeedle(query)
  if (!needle) return null

  const matches = new Map<string, TopicMatch>()
  for (const topic of topics) {
    let feedbackCount = 0
    let snippet: string | null = null
    for (const point of topic.feedbackSegment) {
      const found = snippetOf(point.quote, needle) ?? snippetOf(point.originalFeedback, needle)
      if (!found) continue
      feedbackCount += 1
      snippet ??= found
    }
    if (
      feedbackCount > 0 ||
      includesNeedle(topic.label, needle) ||
      topic.keywords.some((keyword) => includesNeedle(keyword.text, needle))
    ) {
      matches.set(topic.id, { feedbackCount, snippet })
    }
  }
  return matches
}
