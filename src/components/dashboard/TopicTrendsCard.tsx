import { ArrowDown, ArrowUp, Info, Pin } from 'lucide-react'
import { useState } from 'react'
import {
  Area,
  AreaChart,
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
  TrendSentimentPoint,
  TrendTopicSeries,
  TrendTopicSummary,
  TrendVolumePoint,
} from '../../data/dashboardAnalytics'
import {
  SENTIMENT_KEYS,
  sentimentBands,
  sharesOf,
  sumSentiment,
  topicSentimentPoints,
} from '../../lib/sentimentTrendSummary'
import { cn } from '../../lib/utils'
import { SENTIMENT_COLORS } from './sentimentColors'
import { Tooltip as HoverTooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { PeriodSentimentDetail, PeriodSentimentTooltip } from './PeriodSentimentTooltip'
import { TOPIC_TREND_COLORS } from './trendColors'

const AXIS_TICK = { fill: '#73777e', fontSize: 10 } as const

// Both charts share this so the hover line runs through volume and sentiment together.
const SYNC_ID = 'topic-trends'
// Same left/right geometry on both charts, so their x positions line up exactly.
const CHART_MARGIN = { top: 12, right: 18, bottom: 0, left: 4 }
const Y_AXIS_WIDTH = 36

const colorFor = (index: number) => TOPIC_TREND_COLORS[index % TOPIC_TREND_COLORS.length]
const totalOf = (counts: SentimentCounts) => counts.negative + counts.neutral + counts.positive

// One grid for the header and every row, so the columns line up like a table.
const ROW_GRID = 'grid grid-cols-[minmax(0,1fr)_2.75rem_2.25rem_5.5rem] items-center gap-x-2'

function NegativeCell({ counts }: { counts: SentimentCounts }) {
  const total = totalOf(counts)
  return (
    <span className="flex items-center justify-end gap-1.5">
      <span
        aria-hidden="true"
        className="flex h-1.5 w-11 shrink-0 overflow-hidden rounded-full bg-[#eef1f6]"
      >
        {total > 0
          ? SENTIMENT_KEYS.map((key) => (
              <span
                key={key}
                style={{ backgroundColor: SENTIMENT_COLORS[key], width: `${(counts[key] / total) * 100}%` }}
              />
            ))
          : null}
      </span>
      <span className="w-8 text-right text-[11px] text-[#726f6f]">
        {total > 0 ? `${sharesOf(counts).negative}%` : '—'}
      </span>
    </span>
  )
}

function DeltaCell({ value }: { value: number | null }) {
  if (value === null) return <span />
  if (value === 0) return <span className="text-right text-[11px] text-[#929292]">–</span>
  return (
    // Neutral colour on purpose: more mentions isn't good or bad by itself.
    <span className="inline-flex items-center justify-end text-[11px] font-semibold text-[#3f4045]">
      {value > 0 ? <ArrowUp size={11} strokeWidth={2.6} /> : <ArrowDown size={11} strokeWidth={2.6} />}
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
 *   faded, row highlighted) and previews it across the card — sentiment strip and
 *   summary included. While a topic is pinned, hover no longer changes the focus. Clicking a row or a line pins it — and Sentiment Trend
 *   switches to that topic — click again to release.
 * - Rows keep a fixed order (by window total) so they don't jump while you scrub.
 */
export function TopicTrendsCard({
  series,
  data,
  sentimentByTopic,
  summaries,
  sentimentSeries,
  action,
  pinnedTopic,
  onPinnedTopicChange,
}: {
  series: TrendTopicSeries[]
  data: TrendVolumePoint[]
  sentimentByTopic: Record<string, SentimentCounts[]>
  summaries: TrendTopicSummary[]
  /** Whole-form sentiment per period (the strip's default, when nothing is pinned). */
  sentimentSeries: TrendSentimentPoint[]
  /** Controls that only affect this chart (the topic picker), right of the title. */
  action?: React.ReactNode
  /** The pinned topic — owned by TrendView, since Sentiment Trend follows it too. */
  pinnedTopic: string | null
  onPinnedTopicChange: (id: string | null) => void
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null)
  // A pin locks the focus: while one is set, hovering other lines/rows doesn't
  // switch the card (scrubbing along the pinned line would otherwise keep jumping to
  // whichever line the pointer passes). Clicking another topic moves the pin.
  const focusTopic = pinnedTopic ?? hoveredTopic
  const togglePin = (id: string) => onPinnedTopicChange(pinnedTopic === id ? null : id)
  // The pointer is over the lines (not the sentiment strip): only there does a click pin.
  const [overLines, setOverLines] = useState(false)
  // What clicking `id` will do — one wording for the chart's lines and the panel's rows.
  const pinHint = (id: string, label: string) =>
    pinnedTopic === id
      ? 'Pinned — click to unpin'
      : pinnedTopic
        ? `Click to highlight ${label} instead`
        : 'Click to keep this topic highlighted'
  const hoveredLabel = series.find((entry) => entry.id === hoveredTopic)?.label
  const lineClickNote =
    overLines && hoveredTopic && hoveredLabel ? pinHint(hoveredTopic, hoveredLabel) : undefined

  const colorById = new Map(series.map((entry, index) => [entry.id, colorFor(index)]))
  const summaryById = new Map(summaries.map((summary) => [summary.id, summary]))
  // Fixed order: biggest over the whole window first.
  const rows = [...series].sort(
    (a, b) => (summaryById.get(b.id)?.mentions ?? 0) - (summaryById.get(a.id)?.mentions ?? 0),
  )

  // Sentiment strip + summary: the focused topic's, else the whole form's.
  // Follows the *focused* topic — hovered, else pinned — so hovering a line or a row
  // previews that topic's sentiment across the whole card.
  const focusEntry = series.find((entry) => entry.id === focusTopic)
  const labels = data.map((p) => String(p.label))
  const stripPoints =
    focusEntry && sentimentByTopic[focusEntry.id]
      ? topicSentimentPoints(labels, sentimentByTopic[focusEntry.id]!)
      : sentimentSeries
  // "All topics" row: the whole form (every topic, charted or not) for the period.
  const zero: SentimentCounts = { negative: 0, neutral: 0, positive: 0 }
  const overallCounts: SentimentCounts =
    hoverIndex !== null
      ? (sentimentSeries[hoverIndex]?.counts ?? zero)
      : sumSentiment(sentimentSeries.map((p) => p.counts))
  const overallPrevious =
    hoverIndex !== null && hoverIndex > 0 ? sentimentSeries[hoverIndex - 1]?.counts : undefined

  const point = hoverIndex !== null ? data[hoverIndex] : undefined
  const previousPoint = hoverIndex !== null && hoverIndex > 0 ? data[hoverIndex - 1] : undefined
  const count = (p: TrendVolumePoint | undefined, id: string) => Number(p?.[id] ?? 0)
  const periodLabel = point ? String(point.label) : 'Whole period'

  return (
    <section className="flex flex-col rounded-[15px] border border-[#e9eaed] bg-white px-5.5 pt-2.5 pb-5">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <div className="flex items-center gap-2">
          <h2 className="m-0 text-[16px] leading-9.25 font-semibold tracking-[0.16px] text-black">
            Topic Trends (by volume)
          </h2>
          <HoverTooltip>
            <TooltipTrigger asChild>
              <button
                aria-label="How to read Topic Trends"
                className="flex size-5 cursor-help items-center justify-center rounded-full text-[#929292] transition-colors hover:text-[#3f4045]"
                type="button"
              >
                <Info size={15} />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-72 whitespace-normal leading-4.5 text-[#3f4045]" side="top">
              Lines show mentions per period; the band below shows sentiment. Hover a date or a
              topic to see its numbers, click a topic to pin it.
            </TooltipContent>
          </HoverTooltip>
        </div>
        {action ? <div className="flex items-center gap-2.5">{action}</div> : null}
      </div>

      <div className="mt-2 grid grid-cols-[minmax(0,1fr)_minmax(340px,420px)] gap-5 max-[900px]:grid-cols-1">
        {/* Clicking a line focuses recharts' (keyboard-navigable) chart; hide the focus
            ring for mouse focus, keep it for keyboard. */}
        {/* A hovered topic stays focused while the mouse is anywhere over the two
            charts (moving along the dates, or down to the sentiment strip) and is
            released only on leaving them — otherwise the strip would flicker back to
            "All topics" every time the pointer slipped off the line. */}
        <div
          className="flex min-w-0 flex-col [&_*:focus:not(:focus-visible)]:outline-none"
          onMouseLeave={() => setHoveredTopic(null)}
        >
          <div className="h-56 w-full">
            <ResponsiveContainer height="100%" width="100%">
              <LineChart
                data={data}
                margin={CHART_MARGIN}
                onMouseLeave={() => {
                  setHoverIndex(null)
                  setOverLines(false)
                }}
                onMouseMove={(state) => {
                  const index = Number(state.activeTooltipIndex)
                  setHoverIndex(Number.isInteger(index) ? index : null)
                  setOverLines(true)
                }}
                syncId={SYNC_ID}
              >
                <CartesianGrid stroke="#f3f5f8" vertical={false} />
                {/* Dates are labelled once, under the sentiment strip below. */}
                <XAxis dataKey="label" hide />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  domain={[0, 'auto']}
                  tick={AXIS_TICK}
                  tickLine={false}
                  width={Y_AXIS_WIDTH}
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
                    onClick={() => togglePin(entry.id)}
                    onMouseEnter={() => setHoveredTopic(entry.id)}
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

          {/* Sentiment over the same dates, directly under the volume lines. */}
          <p className="m-0 mt-1 flex items-center gap-1.5 pl-10 text-[11px] text-[#726f6f]">
            <span className="font-semibold text-[#3f4045]">Sentiment</span>·
            {focusEntry ? (
              <span
                aria-hidden="true"
                className="size-2 rounded-full"
                style={{ backgroundColor: colorById.get(focusEntry.id) }}
              />
            ) : null}
            <span className="truncate">{focusEntry ? focusEntry.label : 'All topics'}</span>
          </p>
          <div
            aria-label={`Sentiment for ${focusEntry ? focusEntry.label : 'all topics'}`}
            className="h-24 w-full"
            role="img"
          >
            <ResponsiveContainer height="100%" width="100%">
              <AreaChart
                data={sentimentBands(stripPoints)}
                margin={{ ...CHART_MARGIN, top: 4 }}
                onMouseLeave={() => setHoverIndex(null)}
                onMouseMove={(state) => {
                  const index = Number(state.activeTooltipIndex)
                  setHoverIndex(Number.isInteger(index) ? index : null)
                }}
                syncId={SYNC_ID}
              >
                <XAxis
                  axisLine={false}
                  dataKey="label"
                  interval="preserveStartEnd"
                  minTickGap={24}
                  tick={AXIS_TICK}
                  tickLine={false}
                />
                <YAxis
                  axisLine={false}
                  domain={[0, 100]}
                  tick={AXIS_TICK}
                  tickFormatter={(value: number) => `${value}%`}
                  tickLine={false}
                  ticks={[0, 100]}
                  width={Y_AXIS_WIDTH}
                />
                {/* The sentiment split for the hovered date. Synced with the volume chart
                    (syncId), so it also shows while hovering the lines above — drawn here
                    rather than over the lines so it doesn't cover them. */}
                <Tooltip
                  allowEscapeViewBox={{ x: false, y: true }}
                  // Pinned just above the strip (x still follows the cursor), so it
                  // never spills past the card's bottom edge.
                  position={{ y: -54 }}
                  content={({ label }) => {
                    const stripPoint = stripPoints.find((p) => p.label === label)
                    return stripPoint ? (
                      <PeriodSentimentTooltip
                        counts={stripPoint.counts}
                        label={stripPoint.label}
                        note={lineClickNote}
                        scope={focusEntry ? focusEntry.label : 'All topics'}
                        shares={stripPoint}
                      />
                    ) : null
                  }}
                  cursor={{ stroke: '#c9cfdb', strokeWidth: 1 }}
                  offset={14}
                />
                {(['positive', 'neutral', 'negative'] as const).map((key) => (
                  <Area
                    activeDot={false}
                    connectNulls
                    dataKey={key}
                    fill={SENTIMENT_COLORS[key]}
                    fillOpacity={1}
                    isAnimationActive={false}
                    key={key}
                    // No stroke: the translucent fills would draw a darker seam along it.
                    stroke="none"
                    type="monotone"
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex min-w-0 flex-col border-l border-[#eef0f4] pl-5 max-[900px]:border-t max-[900px]:border-l-0 max-[900px]:pt-4 max-[900px]:pl-0">
          <p aria-live="polite" className="m-0 mb-1.5 text-[12px] font-semibold text-[#14181f]">
            {periodLabel}
          </p>
          <div className={cn(ROW_GRID, 'px-2 pb-1 text-[10px] font-medium text-[#929292]')}>
            <span>Topic</span>
            <span className="text-right">Mentions</span>
            <span className="text-right" title="Change vs the previous period">
              Δ
            </span>
            <span className="text-right">Negative</span>
          </div>

          {/* Whole form, same columns as the topics below. */}
          <HoverTooltip delayDuration={400}>
            <TooltipTrigger asChild>
              <div
                className={cn(ROW_GRID, 'cursor-default rounded-[8px] bg-[#f7f8fb] px-2 py-1.5')}
                tabIndex={0}
              >
                <span className="truncate text-[12px] font-semibold text-[#14181f]">All topics</span>
                <span className="text-right text-[12px] font-semibold text-[#14181f]">
                  {totalOf(overallCounts)}
                </span>
                <DeltaCell
                  value={overallPrevious ? totalOf(overallCounts) - totalOf(overallPrevious) : null}
                />
                <NegativeCell counts={overallCounts} />
              </div>
            </TooltipTrigger>
            <TooltipContent className="py-1.5" side="left">
              <PeriodSentimentDetail
                counts={overallCounts}
                delta={overallPrevious ? totalOf(overallCounts) - totalOf(overallPrevious) : null}
                label={periodLabel}
                note="Every topic in this form, including ones not drawn on the chart"
                scope="All topics"
                shares={sharesOf(overallCounts)}
              />
            </TooltipContent>
          </HoverTooltip>

          <ul className="m-0 mt-1 flex list-none flex-col p-0">
            {rows.map((entry) => {
              const focused = focusTopic === entry.id
              const pinned = pinnedTopic === entry.id
              const summary = summaryById.get(entry.id)
              const bucketSentiment =
                hoverIndex !== null ? sentimentByTopic[entry.id]?.[hoverIndex] : undefined
              const sentiment: SentimentCounts = bucketSentiment ?? summary ?? zero
              const mentions = point ? count(point, entry.id) : (summary?.mentions ?? 0)
              const delta =
                point && previousPoint ? count(point, entry.id) - count(previousPoint, entry.id) : null
              return (
                <li key={entry.id}>
                  <HoverTooltip delayDuration={400}>
                    <TooltipTrigger asChild>
                      <button
                        aria-pressed={pinned}
                        className={cn(
                          ROW_GRID,
                          'w-full cursor-pointer rounded-[8px] border-0 bg-transparent px-2 py-1.5 text-left transition-colors hover:bg-[#f7f8fb]',
                          focused && 'bg-[#f3f7ff] hover:bg-[#f3f7ff]',
                          focusTopic !== null && !focused && 'opacity-55',
                        )}
                        onClick={() => togglePin(entry.id)}
                        onMouseEnter={() => setHoveredTopic(entry.id)}
                        onMouseLeave={() => setHoveredTopic(null)}
                        type="button"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span
                            aria-hidden="true"
                            className="size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: colorById.get(entry.id) }}
                          />
                          <span
                            className={cn(
                              'min-w-0 truncate text-[12px] text-[#14181f]',
                              focused ? 'font-semibold' : 'font-medium',
                            )}
                          >
                            {entry.label}
                          </span>
                          {pinned ? <Pin className="shrink-0 text-[#1e55c5]" size={12} /> : null}
                        </span>
                        <span className="text-right text-[12px] font-semibold text-[#14181f]">
                          {mentions}
                        </span>
                        <DeltaCell value={delta} />
                        <NegativeCell counts={sentiment} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="py-1.5" side="left">
                      <PeriodSentimentDetail
                        counts={sentiment}
                        delta={delta}
                        label={periodLabel}
                        note={pinHint(entry.id, entry.label)}
                        scope={entry.label}
                        shares={sharesOf(sentiment)}
                      />
                    </TooltipContent>
                  </HoverTooltip>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
