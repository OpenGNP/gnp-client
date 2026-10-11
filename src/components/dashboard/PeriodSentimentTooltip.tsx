import { ArrowDown, ArrowUp } from 'lucide-react'

import type { SentimentCounts } from '../../data/dashboardAnalytics'
import { SENTIMENT_KEYS, SMALL_SAMPLE_MENTIONS, type SentimentKey } from '../../lib/sentimentTrendSummary'
import { SENTIMENT_DOT_COLORS } from './sentimentColors'

const sentimentName = (key: SentimentKey) => key[0]!.toUpperCase() + key.slice(1)

/**
 * One period's sentiment, as a chart tooltip: two compact lines, so it can sit near
 * the chart without covering much. Shared by the Trend tab's sentiment strip and the
 * Themes panel's "Mentions over time" bars, so both read the same way.
 *
 * - Line 1: the period, an optional scope (topic name), mentions, change vs the
 *   previous period. A small sample reads "only N mentions", in amber.
 * - Line 2: the sentiment split as % with the counts behind it, when known.
 * - Optional line 3: a hint (e.g. "Click to pin").
 */
export function PeriodSentimentTooltip(props: PeriodSentimentDetailProps) {
  return (
    <div className="rounded-[8px] border border-[#e8eaf1] bg-white px-3 py-1.5 text-[12px] whitespace-nowrap shadow-[0_8px_24px_rgba(15,23,42,0.14)]">
      <PeriodSentimentDetail {...props} />
    </div>
  )
}

type PeriodSentimentDetailProps = {
  label: string
  scope?: string
  shares: Record<SentimentKey, number>
  /** The counts behind `shares`; without them the mention count is left out. */
  counts?: SentimentCounts
  /** Mentions when there's no split to show (e.g. an older server): line 2 is dropped. */
  mentions?: number
  /** Change in mentions vs the previous period; null to leave it out. */
  delta?: number | null
  note?: string
}

/**
 * The tooltip's contents without its box, for hosts that draw their own (the Radix
 * TooltipContent on Topic Trends' panel rows).
 */
export function PeriodSentimentDetail({
  label,
  scope,
  shares,
  counts,
  mentions,
  delta = null,
  note,
}: PeriodSentimentDetailProps) {
  const total = counts
    ? counts.negative + counts.neutral + counts.positive
    : (mentions ?? shares.negative + shares.neutral + shares.positive)
  const showCount = counts !== undefined || mentions !== undefined
  const smallSample = showCount && total > 0 && total < SMALL_SAMPLE_MENTIONS
  return (
    <div className="flex flex-col gap-1">
      <p className="m-0 flex items-center gap-1.5 text-[11px] text-[#929292]">
        <span className="font-semibold text-[#14181f]">{label}</span>
        {scope ? (
          <>
            ·<span className="max-w-72 truncate">{scope}</span>
          </>
        ) : null}
        {showCount ? (
          <>
            ·
            <span className={smallSample ? 'font-medium text-[#9a6700]' : undefined}>
              {smallSample ? 'only ' : ''}
              {total} mention{total === 1 ? '' : 's'}
            </span>
          </>
        ) : null}
        {delta !== null && delta !== 0 ? (
          // Neutral colour on purpose: more mentions isn't good or bad by itself.
          <span className="inline-flex items-center font-semibold text-[#3f4045]">
            {delta > 0 ? <ArrowUp size={11} strokeWidth={2.6} /> : <ArrowDown size={11} strokeWidth={2.6} />}
            {Math.abs(delta)}
          </span>
        ) : null}
      </p>
      {total === 0 ? (
        <p className="m-0 text-[11px] text-[#929292]">No feedback in this period</p>
      ) : counts === undefined && mentions !== undefined ? null : (
        <p className="m-0 flex items-center gap-3">
          {SENTIMENT_KEYS.map((key) => (
            <span className="flex items-center gap-1" key={key}>
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: SENTIMENT_DOT_COLORS[key] }}
              />
              <span className="text-[#726f6f]">{sentimentName(key)}</span>
              <span className="font-semibold text-[#14181f]">{shares[key]}%</span>
              {counts ? <span className="text-[11px] text-[#929292]">({counts[key]})</span> : null}
            </span>
          ))}
        </p>
      )}
      {note ? <p className="m-0 text-[11px] text-[#929292]">{note}</p> : null}
    </div>
  )
}
