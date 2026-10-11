import type { SentimentCounts, TrendSentimentPoint } from '../data/dashboardAnalytics'

export const SENTIMENT_KEYS = ['negative', 'neutral', 'positive'] as const
export type SentimentKey = (typeof SENTIMENT_KEYS)[number]

/** Below this many mentions in a period, its percentages swing too easily to trust. */
export const SMALL_SAMPLE_MENTIONS = 5

/**
 * One topic's sentiment as Sentiment Trend points: per-period counts (from the trend
 * API's `topicSentimentSeries`) turned into rounded shares, labelled like the chart.
 */
export function topicSentimentPoints(
  labels: string[],
  counts: SentimentCounts[],
): TrendSentimentPoint[] {
  return labels.map((label, i) => {
    const c = counts[i] ?? { negative: 0, neutral: 0, positive: 0 }
    const total = c.negative + c.neutral + c.positive
    if (total === 0) return { label, negative: 0, neutral: 0, positive: 0, counts: c }
    const negative = Math.round((c.negative / total) * 100)
    const neutral = Math.round((c.neutral / total) * 100)
    return { label, negative, neutral, positive: 100 - negative - neutral, counts: c }
  })
}

/** Sums sentiment counts (e.g. every period of a window). */
export function sumSentiment(counts: (SentimentCounts | undefined)[]): SentimentCounts {
  return counts.reduce<SentimentCounts>(
    (sum, c) => ({
      negative: sum.negative + (c?.negative ?? 0),
      neutral: sum.neutral + (c?.neutral ?? 0),
      positive: sum.positive + (c?.positive ?? 0),
    }),
    { negative: 0, neutral: 0, positive: 0 },
  )
}

/** Rounded shares (%) of a set of counts, summing to 100 (all 0 when empty). */
export function sharesOf(counts: SentimentCounts): Record<SentimentKey, number> {
  const total = counts.negative + counts.neutral + counts.positive
  if (total === 0) return { negative: 0, neutral: 0, positive: 0 }
  const negative = Math.round((counts.negative / total) * 100)
  const neutral = Math.round((counts.neutral / total) * 100)
  return { negative, neutral, positive: 100 - negative - neutral }
}

export type SentimentBand = {
  label: string
  positive: [number, number] | null
  neutral: [number, number] | null
  negative: [number, number] | null
}

/**
 * Chart data for stacked sentiment shares, drawn as explicit [bottom, top] ranges
 * (positive at the bottom, negative on top). Recharts' own stacking counts a missing
 * value as 0, so a period with no feedback would show sentiment collapsing to
 * nothing; as ranges, an empty period is a null the bands bridge (`connectNulls`).
 */
export function sentimentBands(points: TrendSentimentPoint[]): SentimentBand[] {
  return points.map((point) =>
    point.negative + point.neutral + point.positive === 0
      ? { label: point.label, positive: null, neutral: null, negative: null }
      : {
          label: point.label,
          positive: [0, point.positive],
          neutral: [point.positive, point.positive + point.neutral],
          negative: [point.positive + point.neutral, 100],
        },
  )
}
