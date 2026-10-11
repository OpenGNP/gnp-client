import type { SentimentCounts, TrendSentimentPoint } from '../data/dashboardAnalytics'

export const SENTIMENT_KEYS = ['negative', 'neutral', 'positive'] as const
export type SentimentKey = (typeof SENTIMENT_KEYS)[number]

const isEmpty = (point: TrendSentimentPoint) =>
  point.negative + point.neutral + point.positive === 0

export type SentimentSnapshot = {
  /** Period being described (the hovered one, or the latest with data). */
  label: string
  /** Share of each sentiment in that period (%). */
  shares: Record<SentimentKey, number>
  /** The mention counts behind those shares (null when the API didn't send them). */
  counts: SentimentCounts | null
  /** All mentions in that period (null when unknown). */
  total: number | null
  /**
   * Percentage-point change of each share vs the first period with data, or null
   * when there's nothing earlier to compare against.
   */
  changes: Record<SentimentKey, number> | null
  /** Label of the first period with data (the comparison baseline). */
  baselineLabel: string | null
}

/**
 * Sentiment Trend's numbers under the chart. Periods with no feedback are skipped
 * (the API reports them as 0/0/0), so "since …" always means the first real data.
 * `index` picks a period (chart hover); otherwise the latest period with data.
 */
export function sentimentSnapshot(
  data: TrendSentimentPoint[],
  index: number | null = null,
): SentimentSnapshot | null {
  const withData = data.map((point, i) => ({ point, i })).filter(({ point }) => !isEmpty(point))
  if (withData.length === 0) return null

  const baseline = withData[0]!
  const hovered = index !== null ? data[index] : undefined
  const target = hovered && !isEmpty(hovered) ? { point: hovered, i: index! } : withData[withData.length - 1]!
  const shares = {
    negative: target.point.negative,
    neutral: target.point.neutral,
    positive: target.point.positive,
  }
  const counts = target.point.counts ?? null
  const changes =
    target.i === baseline.i
      ? null
      : {
          negative: target.point.negative - baseline.point.negative,
          neutral: target.point.neutral - baseline.point.neutral,
          positive: target.point.positive - baseline.point.positive,
        }

  return {
    label: target.point.label,
    shares,
    counts,
    total: counts ? counts.negative + counts.neutral + counts.positive : null,
    changes,
    baselineLabel: changes ? baseline.point.label : null,
  }
}

/** Below this many mentions in a period, its percentages swing too easily to trust. */
export const SMALL_SAMPLE_MENTIONS = 5
