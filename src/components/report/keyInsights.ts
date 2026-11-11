import type { FormThemeAnalytics } from '../../api/analytics'
import type { TopicSortOption } from '../dashboard/topicSort'

export const UNCATEGORISED_ID = 'uncategorised'

export const percent = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0)

/** review = violations to check, fix = what drags the score down, keep = what people like. */
export type InsightKind = 'review' | 'fix' | 'keep'

/** `topicId` is null for the violations card, which spans several topics; `share` is the % in `detail`. */
export type Insight = { kind: InsightKind; label: string; title: string; detail: string; topicId: string | null; share?: number }

// Pink = violations (as on the landing page), red = negative, green = positive.
// `box` is the report's card; `text` colours its label and the dashboard strip's label.
export const INSIGHT_STYLES: Record<InsightKind, { box: string; text: string }> = {
  review: { box: 'border-[#e0507a] bg-[#ffe4ec]', text: 'text-[#c2365f]' },
  // Trend's "Getting worse" red and the Negative chip's tint (SENTIMENT_BADGE_CLASSES).
  fix: { box: 'border-[#e12b0c] bg-[#f9eaea]', text: 'text-[#e12b0c]' },
  keep: { box: 'border-[#0b842d] bg-[#e6f4ea]', text: 'text-[#0b842d]' },
}

/** What the report puts first, in words, for the banner above everything else. */
export const SORT_FOCUS: Record<TopicSortOption, string> = {
  priority: 'Violations first, then the most negative feedback.',
  negative: 'Topics with the most negative feedback first.',
  mentions: 'The most talked-about topics first.',
  positive: 'What people liked most first.',
}

/**
 * The report's top takeaways: violations to review (when there are any), what drags the
 * score down most (share of all negative mentions), and what people like most.
 */
export function keyInsights(
  themes: FormThemeAnalytics,
  // The dashboard leaves violations to its own card.
  { violations = true }: { violations?: boolean } = {},
): Insight[] {
  const topics = themes.aiDiscoveredTopics.filter((topic) => topic.id !== UNCATEGORISED_ID)
  const { negative, positive } = themes.sentiment
  const byNegative = topics.filter((t) => t.negative > 0).sort((a, b) => b.negative - a.negative)
  const mostPraised = topics.filter((t) => t.positive > 0).sort((a, b) => b.positive - a.positive)[0]

  const flagged = themes.aiDiscoveredTopics.filter((t) => t.hasViolation)
  const flaggedCount = !violations ? 0 : flagged.reduce((sum, t) => sum + t.feedbackSegment.filter((p) => p.violation).length, 0)
  const insights: Insight[] = []
  if (flaggedCount > 0) {
    insights.push({
      kind: 'review',
      label: 'Review now',
      title: `${flaggedCount} ${flaggedCount === 1 ? 'violation' : 'violations'} in ${flagged.length} ${flagged.length === 1 ? 'topic' : 'topics'}`,
      detail: flagged.map((t) => t.label).join(', '),
      topicId: null,
    })
  }
  const [first] = byNegative
  if (first) {
    insights.push({ kind: 'fix', label: 'Fix first', title: first.label, detail: `${percent(first.negative, negative)}% of negative mentions`, topicId: first.id, share: percent(first.negative, negative) })
  }
  if (mostPraised) {
    insights.push({
      kind: 'keep',
      label: 'Keep doing',
      title: mostPraised.label,
      detail: `${percent(mostPraised.positive, positive)}% of positive mentions`,
      topicId: mostPraised.id,
      share: percent(mostPraised.positive, positive),
    })
  }
  return insights
}
