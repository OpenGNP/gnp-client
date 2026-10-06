export const SENTIMENT_SCORE_OUT_OF = 5

/**
 * Sentiment score on 0–5: positive = 5, neutral = 2.5, negative = 0 — net sentiment
 * (−1…+1) stretched onto the gauge, so all-negative reads 0 and balanced reads 2.5.
 * Must match the server's Overall Sentiment score (gnp-server analyticsService.formThemes).
 */
export function sentimentScore(counts: { negative: number; neutral: number; positive: number }) {
  const total = counts.negative + counts.neutral + counts.positive
  if (total === 0) return 0
  return Math.round(((counts.positive * 5 + counts.neutral * 2.5) / total) * 10) / 10
}

/** Whole-number share of `value` in `total` (0 when there's nothing). */
export function percentOf(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0
}
