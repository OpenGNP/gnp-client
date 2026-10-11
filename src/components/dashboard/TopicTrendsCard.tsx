import { ArrowDown, ArrowUp, Pin } from 'lucide-react'
import { useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type {
  SentimentCounts,
  TrendTopicSeries,
  TrendTopicSummary,
  TrendVolumePoint,
} from '../../data/dashboardAnalytics'
import { cn } from '../../lib/utils'
import { TOPIC_TREND_COLORS } from './trendColors'

const AXIS_TICK = { fill: '#73777e', fontSize: 10 } as const

const SENTIMENT_BAR = {
  negative: '#FD798F',
  neutral: '#FED871',
  positive: '#B5E6B1',
} as const

const colorFor = (index: number) => TOPIC_TREND_COLORS[index % TOPIC_TREND_COLORS.length]
const totalOf = (counts: SentimentCounts) => counts.negative + counts.neutral + counts.positive

function SentimentBar({ counts }: { counts: SentimentCounts }) {
  const total = totalOf(counts)
  const negativePct = total > 0 ? Math.round((counts.negative / total) * 100) : 0
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div
        aria-hidden="true"
        className="flex h-1.5 w-28 shrink-0 overflow-hidden rounded-full bg-[#eef1f6]"
      >
        {total > 0
          ? (['negative', 'neutral', 'positive'] as const).map((key) => (
              <span
                key={key}
                style={{
                  backgroundColor: SENTIMENT_BAR[key],
                  width: `${(counts[key] / total) * 100}%`,
                }}
              />
            ))
          : null}
      </div>
      <span className="w-14 shrink-0 text-[11px] whitespace-nowrap text-[#726f6f]">
        {total > 0 ? `${negativePct}% neg` : '—'}
      </span>
    </div>
  )
}

function Delta({ value }: { value: number | null }) {
  if (value === null) return null
  if (value === 0) {
    return <span className="w-8 shrink-0 text-right text-[11px] text-[#929292]">–</span>
  }
  const up = value > 0
  return (
    <span
      className={cn(
        'inline-flex w-8 shrink-0 items-center justify-end gap-0.5 text-[11px] font-semibold',
        // Neutral colour on purpose: more mentions isn't good or bad by itself.
        'text-[#3f4045]',
      )}
      title={`${up ? '+' : ''}${value} vs previous period`}
    >
      {up ? <ArrowUp size={11} strokeWidth={2.6} /> : <ArrowDown size={11} strokeWidth={2.6} />}
      {Math.abs(value)}
    </span>
  )
}

/**
 * Topic Trends (by volume): full-width line chart with a linked side panel instead
 * of a floating tooltip, so nothing covers the lines.
 *
 * - The panel lists every charted topic: mentions, change vs the previous period
 *   and a sentiment bar. With nothing hovered it shows the whole window; hovering
 *   the chart switches it to that period.
 * - Hovering near a line, or a panel row, focuses that topic (thicker line, others
 *   faded, row highlighted). Clicking a row pins the focus; click again to release.
 * - Rows keep a fixed order (by window total) so they don't jump while you scrub.
 */
export function TopicTrendsCard({
  series,
  data,
  sentimentByTopic,
  summaries,
  action,
}: {
  series: TrendTopicSeries[]
  data: TrendVolumePoint[]
  sentimentByTopic: Record<string, SentimentCounts[]>
  summaries: TrendTopicSummary[]
  /** Controls that only affect this chart (the topic picker), right of the title. */
  action?: React.ReactNode
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null)
  const [pinnedTopic, setPinnedTopic] = useState<string | null>(null)
  const focusTopic = hoveredTopic ?? pinnedTopic

  const colorById = new Map(series.map((entry, index) => [entry.id, colorFor(index)]))
  const summaryById = new Map(summaries.map((summary) => [summary.id, summary]))
  // Fixed order: biggest over the whole window first.
  const rows = [...series].sort(
    (a, b) => (summaryById.get(b.id)?.mentions ?? 0) - (summaryById.get(a.id)?.mentions ?? 0),
  )

  const point = hoverIndex !== null ? data[hoverIndex] : undefined
  const previousPoint = hoverIndex !== null && hoverIndex > 0 ? data[hoverIndex - 1] : undefined
  const count = (p: TrendVolumePoint | undefined, id: string) => Number(p?.[id] ?? 0)

  return (
    <section className="flex flex-col rounded-[15px] border border-[#e9eaed] bg-white px-5.5 pt-2.5 pb-5">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <h2 className="m-0 text-[16px] leading-9.25 font-semibold tracking-[0.16px] text-black">
          Topic Trends (by volume)
        </h2>
        {action ? <div className="flex items-center gap-2.5">{action}</div> : null}
      </div>

      <div className="mt-2 grid grid-cols-[minmax(0,1fr)_minmax(300px,360px)] gap-5 max-[900px]:grid-cols-1">
        <div className="h-72 w-full min-w-0">
          <ResponsiveContainer height="100%" width="100%">
            <LineChart
              data={data}
              margin={{ top: 12, right: 18, bottom: 0, left: 4 }}
              onMouseLeave={() => {
                setHoverIndex(null)
                setHoveredTopic(null)
              }}
              onMouseMove={(state) => {
                const index = Number(state.activeTooltipIndex)
                setHoverIndex(Number.isInteger(index) ? index : null)
              }}
            >
              <CartesianGrid stroke="#f3f5f8" vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="label"
                interval="preserveStartEnd"
                minTickGap={24}
                tick={AXIS_TICK}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                domain={[0, 'auto']}
                tick={AXIS_TICK}
                tickLine={false}
                width={36}
              />
              {/* Only the vertical cursor — the details live in the side panel. */}
              <Tooltip content={() => null} cursor={{ stroke: '#c9cfdb', strokeWidth: 1 }} />
              {series.map((entry) => {
                const focused = focusTopic === entry.id
                const faded = focusTopic !== null && !focused
                return (
                  <Line
                    activeDot={faded ? false : { r: focused ? 5 : 4 }}
                    dataKey={entry.id}
                    dot={false}
                    isAnimationActive={false}
                    key={entry.id}
                    name={entry.label}
                    stroke={colorById.get(entry.id)}
                    strokeOpacity={faded ? 0.18 : 1}
                    strokeWidth={focused ? 3.5 : 2}
                    type="monotone"
                  />
                )
              })}
              {/* Wide invisible copies on top: an easy-to-hit target for "hover this line". */}
              {series.map((entry) => (
                <Line
                  activeDot={false}
                  dataKey={entry.id}
                  dot={false}
                  isAnimationActive={false}
                  key={`hit-${entry.id}`}
                  legendType="none"
                  onMouseEnter={() => setHoveredTopic(entry.id)}
                  onMouseLeave={() => setHoveredTopic(null)}
                  stroke="transparent"
                  strokeWidth={14}
                  style={{ cursor: 'pointer' }}
                  tooltipType="none"
                  type="monotone"
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex min-w-0 flex-col border-l border-[#eef0f4] pl-5 max-[900px]:border-t max-[900px]:border-l-0 max-[900px]:pt-4 max-[900px]:pl-0">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <p aria-live="polite" className="m-0 text-[12px] font-semibold text-[#14181f]">
              {point ? String(point.label) : 'Whole period'}
            </p>
            <p className="m-0 text-[11px] text-[#929292]">
              {point ? 'mentions · vs previous' : 'mentions'}
            </p>
          </div>
          <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
            {rows.map((entry) => {
              const focused = focusTopic === entry.id
              const pinned = pinnedTopic === entry.id
              const summary = summaryById.get(entry.id)
              const bucketSentiment =
                hoverIndex !== null ? sentimentByTopic[entry.id]?.[hoverIndex] : undefined
              const sentiment: SentimentCounts = bucketSentiment ??
                summary ?? { negative: 0, neutral: 0, positive: 0 }
              const mentions = point ? count(point, entry.id) : (summary?.mentions ?? 0)
              const delta = point && previousPoint
                ? count(point, entry.id) - count(previousPoint, entry.id)
                : null
              return (
                <li key={entry.id}>
                  <button
                    aria-pressed={pinned}
                    className={cn(
                      'flex w-full cursor-pointer flex-col gap-1 rounded-[8px] border-0 bg-transparent px-2 py-1.5 text-left transition-colors hover:bg-[#f7f8fb]',
                      focused && 'bg-[#f3f7ff] hover:bg-[#f3f7ff]',
                      focusTopic !== null && !focused && 'opacity-55',
                    )}
                    onClick={() => setPinnedTopic((current) => (current === entry.id ? null : entry.id))}
                    onMouseEnter={() => setHoveredTopic(entry.id)}
                    onMouseLeave={() => setHoveredTopic(null)}
                    title={pinned ? 'Click to unpin' : 'Click to keep this topic highlighted'}
                    type="button"
                  >
                    {/* Line 1: the full topic name + its count. */}
                    <span className="flex w-full items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: colorById.get(entry.id) }}
                      />
                      <span
                        className={cn(
                          'min-w-0 flex-1 truncate text-[12px] text-[#14181f]',
                          focused ? 'font-semibold' : 'font-medium',
                        )}
                        title={entry.label}
                      >
                        {entry.label}
                      </span>
                      {pinned ? <Pin className="shrink-0 text-[#1e55c5]" size={12} /> : null}
                      <span className="shrink-0 text-right text-[13px] font-semibold text-[#14181f]">
                        {mentions}
                      </span>
                      <Delta value={delta} />
                    </span>
                    {/* Line 2: sentiment for the same period. */}
                    <span className="pl-5">
                      <SentimentBar counts={sentiment} />
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          <p className="m-0 mt-auto pt-3 text-[11px] text-[#929292]">
            	Hover for details · Click to pin
          </p>
        </div>
      </div>
    </section>
  )
}
