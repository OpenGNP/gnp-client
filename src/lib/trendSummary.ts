import type { FormTrendAnalytics } from '../data/dashboardAnalytics'

export type TrendSummary = {
  /** What changed, counted; null when the range doesn't hold two complete periods. */
  comparison: { current: string; previous: string; worse: number; new: number; violations: number } | null
  /** The biggest spike in the range (the server sends them biggest first). */
  spike: { topicId: string; label: string; period: string; count: number; usual: number } | null
}

/** The Trend tab's one-line summary: What changed's counts plus the biggest spike. */
export function summarizeTrend(trend: FormTrendAnalytics): TrendSummary {
  const changed = trend.whatChanged
  const comparison = changed
    ? {
        current: changed.currentLabel,
        previous: changed.previousLabel,
        worse: changed.rows.filter((row) => row.kind === 'worse').length,
        new: changed.rows.filter((row) => row.kind === 'new').length,
        violations: changed.rows.reduce((sum, row) => sum + row.violations, 0),
      }
    : null

  const top = trend.timelineEvents[0]
  const label = String(trend.volumeSeries[top?.bucketIndex ?? -1]?.label ?? '')
  const spike = top
    ? {
        topicId: top.topicId,
        label: trend.availableTopics.find((t) => t.id === top.topicId)?.label ?? 'Untitled topic',
        // Same wording as the chart's x-axis and the Unusual spikes card.
        period: trend.bucket === 'week' ? `Week of ${label}` : label,
        count: top.count,
        usual: top.usual,
      }
    : null

  return { comparison, spike }
}
