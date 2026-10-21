import {
  ArrowRight,
  ArrowUp,
  Info,
  MessageSquareText,
  Minus,
  Sparkle,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react'
import { useState } from 'react'

import type {
  FormTrendAnalytics,
  TrendTimelineEvent,
  WhatChanged,
  WhatChangedRow,
} from '../../data/dashboardAnalytics'
import { Tooltip as HoverTooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { TopicTrendsCard } from './TopicTrendsCard'
import { ViolationTooltip } from './ViolationTooltip'

function formatEventDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Pill colours shared with the feedback sentiment tags (FeedbackSegmentSection).
// Worse = complaints went up, Better = down. Each kind differs in fill, not just
// colour (solid / soft / outline / plain), so they stay apart without colour vision.
const KIND_BADGE = {
  worse: { label: 'Worse', Icon: TrendingUp, className: 'bg-[#f63b56] text-white' },
  better: { label: 'Better', Icon: TrendingDown, className: 'bg-[#eaf9ec] text-[#08882c]' },
  new: { label: 'New', Icon: Sparkle, className: 'bg-white text-[#1e55c5] ring-1 ring-[#1e55c5]/50 ring-inset' },
  steady: { label: 'Steady', Icon: Minus, className: 'text-[#929292]' },
} as const

const KIND_HINT: Partial<Record<keyof typeof KIND_BADGE, string>> = {
  steady: 'No clear change in complaints; listed for its possible violations',
}

/** Rows shown before "Show all". */
const WHAT_CHANGED_PREVIEW = 5

function Change({ previous, current, isNew }: { previous: number; current: number; isNew: boolean }) {
  return (
    <span className="w-28 shrink-0 text-center text-[14px] text-[#14181f] tabular-nums">
      <span className="text-[#929292]">{isNew ? '—' : `${previous}%`} → </span>
      {current}%
    </span>
  )
}

const DUMBBELL_COLOR: Record<keyof typeof KIND_BADGE, string> = {
  worse: '#f63b56',
  better: '#269d42',
  new: '#1e55c5',
  steady: '#929292',
}

/**
 * Complaints share before (hollow dot) → now (filled dot) on a shared 0–100% track,
 * so rows compare at a glance. A big move on too few mentions = dashed line + hollow dots.
 */
function ComplaintsDumbbell({ row, kind }: { row: WhatChangedRow; kind: keyof typeof KIND_BADGE }) {
  const { previous, current } = row.complaints
  const isNew = kind === 'new'
  // Moved a lot, but on too few mentions to rule out chance.
  const tentative = kind === 'steady' && Math.abs(current - previous) >= 10
  const color = DUMBBELL_COLOR[kind]
  const counts = row.complaintCounts
  const lo = isNew ? current : Math.min(previous, current)
  const hi = isNew ? current : Math.max(previous, current)
  const dot = 'absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white'
  // Same marks as on the track, so the tooltip doubles as its legend.
  const legendDot = (filled: boolean) => (
    <span
      aria-hidden="true"
      className="inline-block size-2.5 shrink-0 rounded-full border-2"
      style={{ borderColor: color, backgroundColor: filled ? color : 'white' }}
    />
  )

  return (
    <HoverTooltip>
      <TooltipTrigger asChild>
        <span className="flex w-44 shrink-0 flex-col items-stretch gap-0.5">
          {/* px = dot radius, so dots at 0% / 100% stay inside the column. */}
          <span className="px-1.25">
            <span aria-hidden="true" className="relative block h-4">
              <span className="absolute inset-x-0 top-1/2 h-px bg-[#e9eaed]" />
              <span
                className="absolute top-1/2 -translate-y-1/2 border-t-2"
                style={{
                  left: `${lo}%`,
                  width: `${hi - lo}%`,
                  borderColor: color,
                  borderStyle: tentative ? 'dashed' : 'solid',
                }}
              />
              {isNew ? null : (
                <span className={`${dot} border-2 bg-white`} style={{ left: `${previous}%`, borderColor: color }} />
              )}
              <span
                className={`${dot} border-2`}
                style={{ left: `${current}%`, borderColor: color, backgroundColor: tentative ? 'white' : color }}
              />
            </span>
          </span>
          <span className="text-center text-[11px] text-[#726f6f] tabular-nums">
            {isNew ? '—' : `${previous}%`} → {current}%
          </span>
        </span>
      </TooltipTrigger>
      <TooltipContent className="leading-4.5 text-[#3f4045]" side="top">
        <p className="m-0 font-semibold text-[#14181f]">Complaints</p>
        {counts ? (
          <>
            <p className="m-0 flex items-center gap-1.5">
              {isNew ? null : legendDot(false)}
              Before: {isNew ? 'no mentions' : `${counts.previous.negative} of ${counts.previous.total} mentions (${previous}%)`}
            </p>
            <p className="m-0 flex items-center gap-1.5">
              {legendDot(!tentative)}
              Now: {counts.current.negative} of {counts.current.total} mentions ({current}%)
            </p>
          </>
        ) : (
          <p className="m-0">
            {isNew ? '—' : `${previous}%`} → {current}%
          </p>
        )}
        {tentative ? <p className="m-0 text-[11px] text-[#929292]">Too few mentions to tell this from chance</p> : null}
      </TooltipContent>
    </HoverTooltip>
  )
}

function WhatChangedItem({
  row,
  onSelect,
  onOpen,
}: {
  row: WhatChangedRow
  onSelect?: (id: string) => void
  onOpen?: (id: string) => void
}) {
  const kind = row.kind ?? 'steady'
  const badge = KIND_BADGE[kind]
  const isNew = row.kind === 'new'
  return (
    <li
      className={`flex items-center gap-4 pr-5.5 transition-colors max-[640px]:flex-wrap ${
        row.violations > 0 ? 'bg-[#fff7f8] hover:bg-[#fdeff1]' : 'hover:bg-[#f7f8fb]'
      }`}
    >
      <button
        className="flex min-h-13 min-w-0 flex-1 cursor-pointer items-center gap-4 border-l-[3px] border-transparent py-2.5 pl-4.75 text-left max-[640px]:flex-wrap"
        onClick={() => onSelect?.(row.id)}
        title="Show on the chart"
        type="button"
      >
        <span
          className={`flex w-21 shrink-0 items-center justify-center gap-1 rounded-full py-1 text-[11px] font-semibold ${badge.className}`}
          title={KIND_HINT[kind]}
        >
          <badge.Icon className="shrink-0" size={13} />
          {badge.label}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="min-w-0 truncate text-[14px] text-[#14181f]" title={row.label}>
              {row.label}
            </span>
            {row.violations > 0 ? (
              <ViolationTooltip count={row.violations} scope="topic">
                <span className="flex items-center gap-1 text-[12px] font-medium text-[#e0507a]">
                  <TriangleAlert className="shrink-0" size={14} />
                  {row.violations} possible violation{row.violations === 1 ? '' : 's'}
                </span>
              </ViolationTooltip>
            ) : null}
            {row.growth ? (
              <span className="flex shrink-0 items-center gap-1 text-[12px] font-medium text-[#726f6f]">
                <TrendingUp className="shrink-0" size={14} />
                {row.growth}× mentions
              </span>
            ) : null}
          </div>
          {row.quote ? (
            <span className="flex min-w-0 items-center gap-1.5 text-[12px] text-[#726f6f]">
              <MessageSquareText className="shrink-0 text-[#1e55c5]" size={13} />
              <span className="min-w-0 truncate">“{row.quote}”</span>
            </span>
          ) : null}
        </div>
        <Change current={row.share.current} isNew={isNew} previous={row.share.previous} />
        <ComplaintsDumbbell kind={kind} row={row} />
      </button>
      {onOpen ? (
        <button
          aria-label={`View feedback for ${row.label}`}
          className="flex w-28 shrink-0 cursor-pointer items-center justify-end gap-1 border-0 bg-transparent p-0 text-[12px] font-semibold text-[#1e55c5] hover:underline"
          onClick={() => onOpen(row.id)}
          type="button"
        >
          View feedback
          <ArrowRight size={13} />
        </button>
      ) : null}
    </li>
  )
}

function WhatChangedCard({
  data,
  onTopicSelect,
  onTopicOpen,
}: {
  data: WhatChanged | null
  onTopicSelect?: (id: string) => void
  onTopicOpen?: (id: string) => void
}) {
  const [showAll, setShowAll] = useState(false)
  const rows = data ? (showAll ? data.rows : data.rows.slice(0, WHAT_CHANGED_PREVIEW)) : []

  return (
    <section className="flex flex-col rounded-[15px] border border-[#e9eaed] bg-white pt-2.5 pb-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-5.5">
        <div className="flex items-center gap-2">
          <h2 className="m-0 text-[16px] leading-9.25 font-semibold tracking-[0.16px] text-black">
            What changed
          </h2>
          <HoverTooltip>
            <TooltipTrigger asChild>
              <button
                aria-label="How What changed is worked out"
                className="flex size-5 cursor-help items-center justify-center rounded-full text-[#929292] transition-colors hover:text-[#3f4045]"
                type="button"
              >
                <Info size={15} />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-72 whitespace-normal leading-4.5 text-[#3f4045]" side="top">
              The latest complete period against the one before. Worse or Better: the Complaints
              share moved 10 points or more, or the number of people complaining (out of all
              mentions) at least doubled or halved, and the counts are big enough to rule out
              chance. New: no mentions before. Topics with possible violations come first. Click a topic to show
              it on the chart, or View feedback to read it on Themes.
            </TooltipContent>
          </HoverTooltip>
        </div>
        {data ? (
          <span className="text-[12px] font-medium text-[#726f6f]">
            {data.currentLabel} compared with {data.previousLabel}
          </span>
        ) : null}
      </div>

      {!data ? (
        <p className="m-0 px-5.5 py-3 text-[12px] leading-4.5 text-[#929292]">
          Not enough feedback yet to compare two complete periods in this range.
        </p>
      ) : data.rows.length === 0 ? (
        <p className="m-0 px-5.5 py-3 text-[12px] leading-4.5 text-[#929292]">
          No big changes since {data.previousLabel}
        </p>
      ) : (
        <>
          <div className="flex h-6.25 items-center gap-4 px-5.5 text-[12px] font-medium text-[#929292] max-[640px]:hidden">
            <span className="min-w-0 flex-1">Topic</span>
            <span className="w-28 shrink-0 text-center">Share of mentions</span>
            <span className="flex w-44 shrink-0 justify-between">
              <span>0%</span>
              <span>Complaints</span>
              <span>100%</span>
            </span>
            {onTopicOpen ? <span aria-hidden="true" className="w-28 shrink-0" /> : null}
          </div>
          <ul className="m-0 flex list-none flex-col p-0">
            {rows.map((row) => (
              <WhatChangedItem key={row.id} onOpen={onTopicOpen} onSelect={onTopicSelect} row={row} />
            ))}
          </ul>
        </>
      )}
      {data && data.rows.length > WHAT_CHANGED_PREVIEW ? (
        <button
          className="mt-2 cursor-pointer self-start border-0 bg-transparent px-5.5 py-0 text-[12px] font-semibold text-[#1e55c5] hover:underline"
          onClick={() => setShowAll((v) => !v)}
          type="button"
        >
          {showAll ? 'Show less' : `Show all ${data.rows.length}`}
        </button>
      ) : null}
    </section>
  )
}

function TimelineCard({ events }: { events: TrendTimelineEvent[] }) {
  return (
    <section className="flex flex-col gap-3 rounded-[15px] border border-[#f3f4f5] bg-white px-5.75 py-3">
      <h2 className="m-0 text-[16px] leading-9.25 font-semibold tracking-[0.16px] text-black">
        Timeline of Key Events
      </h2>
      <ol className="m-0 flex list-none flex-col p-0">
        {events.map((event, index) => (
          <li className="flex gap-4" key={event.id}>
            <div className="flex flex-col items-center">
              <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-[#1e55c5]" />
              {index < events.length - 1 ? (
                <span className="w-0.5 flex-1 rounded-full bg-[#c9cfdb]" />
              ) : null}
            </div>
            <div className="flex flex-1 items-start justify-between gap-4 pb-4">
              <div className="flex flex-col">
                <p className="m-0 text-[14px] font-semibold tracking-[0.14px] text-black">
                  {formatEventDate(event.date)}
                </p>
                <p className="m-0 text-[12px] tracking-[0.12px] text-black">{event.description}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end">
                <span className="flex items-center gap-0.5 text-[14px] font-semibold tracking-[0.14px] text-[#f63b56]">
                  <ArrowUp size={15} />
                  {event.change}
                </span>
                <span className="text-[10px] tracking-[0.1px] text-[#73777e]">
                  {event.metricLabel}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

export type TrendViewProps = {
  trend: FormTrendAnalytics
  /** The topic picker — it only changes which lines Topic Trends draws, so it lives on that card. */
  topicControl?: React.ReactNode
  /**
   * Pinned topic in Topic Trends (it also switches that card's sentiment strip). Owned
   * by the page so the Themes tab's "Compare with other topics" can open it pinned.
   */
  pinned: string | null
  onPinnedChange: (id: string | null) => void
  /** A What changed row was clicked — chart and pin that topic. */
  onTopicSelect?: (id: string) => void
  /** A What changed row's "View feedback" — open that topic on the Themes tab. */
  onTopicOpen?: (id: string) => void
}

export function TrendView({
  trend,
  topicControl,
  pinned,
  onPinnedChange,
  onTopicSelect,
  onTopicOpen,
}: TrendViewProps) {
  // Ignored once it's no longer on the chart (e.g. the topic picker removed it) — or
  // not on it yet, while a "Compare" jump's new topic selection is still loading.
  const pinnedTopic = trend.topicVolumeSeries.some((entry) => entry.id === pinned) ? pinned : null

  return (
    <div className="flex flex-col gap-4.5">
      {/* Full width: volume lines + the sentiment strip under them, and the topic
          detail side panel. */}
      <div data-tour="trend-chart">
        <TopicTrendsCard
          action={topicControl}
          data={trend.volumeSeries}
          onPinnedTopicChange={onPinnedChange}
          pinnedTopic={pinnedTopic}
          sentimentByTopic={trend.topicSentimentSeries ?? {}}
          sentimentSeries={trend.sentimentSeries}
          series={trend.topicVolumeSeries}
          summaries={trend.topicSummaries ?? []}
        />
      </div>

      <div data-tour="trend-movement">
        <WhatChangedCard
          data={trend.whatChanged ?? null}
          onTopicOpen={onTopicOpen}
          onTopicSelect={onTopicSelect}
        />
      </div>

      <div data-tour="trend-emerging">
        <TimelineCard events={trend.timelineEvents} />
      </div>
    </div>
  )
}
