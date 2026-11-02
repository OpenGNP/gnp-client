import type { TopicSentiment } from '../../data/dashboardAnalytics'

export type TopicSortOption = 'priority' | 'negative' | 'mentions' | 'positive'

const UNCATEGORISED_ID = 'uncategorised'

type Counts = Pick<TopicSentiment, 'negative' | 'neutral' | 'positive'>

const total = (topic: Counts) => topic.negative + topic.neutral + topic.positive

/**
 * The Themes topic orders. gnp-server's exportService (TOPIC_SORTS) mirrors these
 * so the xlsx lists topics as the screen does — change both together.
 */
export const TOPIC_SORT_OPTIONS: {
  value: TopicSortOption
  label: string
  /** Shown under the label in the menu, when the name alone isn't self-explanatory. */
  hint?: string
  compare: (a: Counts, b: Counts) => number
}[] = [
  {
    value: 'priority',
    label: 'Priority',
    hint: 'Most violations, then most negative feedback',
    compare: (a, b) => b.negative - a.negative || total(b) - total(a),
  },
  {
    // Priority's order without putting violation topics first.
    value: 'negative',
    label: 'Most negative',
    compare: (a, b) => b.negative - a.negative || total(b) - total(a),
  },
  {
    value: 'mentions',
    label: 'Most mentioned',
    compare: (a, b) => total(b) - total(a) || b.negative - a.negative,
  },
  {
    value: 'positive',
    label: 'Most positive',
    compare: (a, b) => b.positive - a.positive || total(b) - total(a),
  },
]

export const topicSortLabel = (sort: TopicSortOption) =>
  TOPIC_SORT_OPTIONS.find((option) => option.value === sort)!.label

/** Only Priority puts violation topics first; the other orders mean exactly what they say. */
export const pinsViolations = (sort: TopicSortOption) => sort === 'priority'

/**
 * Topics in the order the Themes tab lists them: the chosen order, uncategorised last,
 * and — for Priority — violation topics first, most violations first. `pinViolations: false`
 * drops that even for Priority — for a "top N" pick, which violations would otherwise fill.
 */
export function sortTopics(
  topics: TopicSentiment[],
  sort: TopicSortOption,
  { pinViolations = pinsViolations(sort) }: { pinViolations?: boolean } = {},
): TopicSentiment[] {
  const compare = TOPIC_SORT_OPTIONS.find((option) => option.value === sort)!.compare
  const pinRank = (topic: TopicSentiment) =>
    topic.id === UNCATEGORISED_ID ? 2 : pinViolations && topic.hasViolation ? 0 : 1
  const violationsIn = new Map(
    topics.map((topic) => [topic.id, topic.feedbackSegment.filter((point) => point.violation).length]),
  )
  // Among the pinned violation topics, the one with more violations first.
  const byViolations = (a: TopicSentiment, b: TopicSentiment) =>
    pinRank(a) === 0 ? violationsIn.get(b.id)! - violationsIn.get(a.id)! : 0
  return [...topics].sort((a, b) => pinRank(a) - pinRank(b) || byViolations(a, b) || compare(a, b))
}
