import type { TopicSentiment } from '../../data/dashboardAnalytics'

const AXIS_STEP = 10
const AXIS_MIN = 10

/** Feedback-point axis max for topic rows: the largest topic, rounded up to a step of 10. */
export function computeAxisMax(topics: TopicSentiment[]): number {
  const highestCount = topics.reduce(
    (max, topic) => Math.max(max, topic.negative + topic.neutral + topic.positive),
    0,
  )
  return Math.max(AXIS_MIN, Math.ceil(highestCount / AXIS_STEP) * AXIS_STEP)
}
