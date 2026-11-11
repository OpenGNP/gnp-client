import type { FormThemeAnalytics } from '../../api/analytics'
import type { TopicSortOption } from '../dashboard/topicSort'

export const UNCATEGORISED_ID = 'uncategorised'

export const percent = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0)

/** review = violations to check, fix = what drags the score down, keep = what people like. */
export type InsightKind = 'review' | 'fix' | 'keep'

export type Insight = { kind: InsightKind; label: string; title: string; detail: string }

/** What the report puts first, in words, for the banner above everything else. */
export const SORT_FOCUS: Record<TopicSortOption, string> = {
  priority: 'Violations first, then the most negative feedback.',
  negative: 'Topics with the most negative feedback first.',
  mentions: 'The most talked-about topics first.',
  positive: 'What people liked most first.',
}

/**
 * Up to three takeaways for the top of the report: violations to review, what drags the
 * score down most (share of all negative mentions), and what people like most.
 */
export function keyInsights(themes: FormThemeAnalytics): Insight[] {
  const topics = themes.aiDiscoveredTopics.filter((topic) => topic.id !== UNCATEGORISED_ID)
  const { negative, positive } = themes.sentiment
  const byNegative = topics.filter((t) => t.negative > 0).sort((a, b) => b.negative - a.negative)
  const mostPraised = topics.filter((t) => t.positive > 0).sort((a, b) => b.positive - a.positive)[0]

  const flagged = themes.aiDiscoveredTopics.filter((t) => t.hasViolation)
  const flaggedCount = flagged.reduce((sum, t) => sum + t.feedbackSegment.filter((p) => p.violation).length, 0)
  const insights: Insight[] = []
  if (flaggedCount > 0) {
    insights.push({
      kind: 'review',
      label: 'Review now',
      title: `${flaggedCount} ${flaggedCount === 1 ? 'violation' : 'violations'} in ${flagged.length} ${flagged.length === 1 ? 'topic' : 'topics'}`,
      detail: flagged.map((t) => t.label).join(', '),
    })
  }
  const [first, second] = byNegative
  if (first) {
    insights.push({ kind: 'fix', label: 'Fix first', title: first.label, detail: `${percent(first.negative, negative)}% of negative mentions` })
  }
  // A violation card takes the second concern's place, so there are still three.
  if (second && flaggedCount === 0) {
    insights.push({ kind: 'fix', label: 'Fix next', title: second.label, detail: `${percent(second.negative, negative)}% of negative mentions` })
  }
  if (mostPraised) {
    insights.push({
      kind: 'keep',
      label: 'Keep doing',
      title: mostPraised.label,
      detail: `${percent(mostPraised.positive, positive)}% of positive mentions`,
    })
  }
  return insights
}
