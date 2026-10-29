import {
  ArrowRight,
  ArrowUp,
  ChevronRight,
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
  WhatChanged,
  WhatChangedRow,
} from '../../data/dashboardAnalytics'
import { whatChangedSummary } from '../../lib/whatChangedSummary'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { Tooltip as HoverTooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { TopicTrendsCard } from './TopicTrendsCard'
import { topicColorMap } from './trendColors'
import { ViolationTooltip } from './ViolationTooltip'

type ChangeKind = 'worse' | 'new' | 'better' | 'steady'

/** The card's groups, in the order to act on them. Steady rows are only there for violations. */
const GROUPS: {
  kind: ChangeKind
  title: string
  Icon: typeof TrendingUp
  tone: string
}[] = [
  {
    kind: 'worse',
    title: 'Getting worse',
    Icon: TrendingUp,
    tone: 'text-[#e12b0c]',
  },
  { kind: 'new', title: 'New topics', Icon: Sparkle, tone: 'text-[#1e55c5]' },
  {
    kind: 'better',
    title: 'Improving',
    Icon: TrendingDown,
    tone: 'text-[#08882c]',
  },
  {
    kind: 'steady',
    title: 'Flagged, no clear change',
    Icon: Minus,
    tone: 'text-[#726f6f]',
  },
]

/** Rows shown per group before "Show all". */
const WHAT_CHANGED_PREVIEW = 5

const DUMBBELL_COLOR: Record<ChangeKind, string> = {
  worse: '#f63b56',
  better: '#269d42',
  new: '#1e55c5',
  steady: '#929292',
}

/**
 * Complaints share before (hollow dot) → now (filled dot) on a shared 0–100% track,
 * so rows compare at a glance. A big move on too few mentions = dashed line + hollow dots.
 */
function ComplaintsDumbbell({ row, kind }: { row: WhatChangedRow; kind: ChangeKind }) {
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
                <span
                  className={`${dot} border-2 bg-white`}
                  style={{ left: `${previous}%`, borderColor: color }}
                />
              )}
              <span
                className={`${dot} border-2`}
                style={{
                  left: `${current}%`,
                  borderColor: color,
                  backgroundColor: tentative ? 'white' : color,
                }}
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
              Before:{' '}
              {isNew
                ? 'no mentions'
                : `${counts.previous.negative} of ${counts.previous.total} mentions (${previous}%)`}
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
        {tentative ? (
          <p className="m-0 text-[11px] text-[#929292]">Too few mentions to tell this from chance</p>
        ) : null}
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
  return (
    <li
      className={`flex items-center gap-4 pr-5.5 transition-colors max-[640px]:flex-wrap ${
        row.violations > 0 ? 'bg-[#fff7f8] hover:bg-[#fdeff1]' : 'hover:bg-[#f7f8fb]'
      }`}
    >
      {/* Capped so on wide screens the dumbbell stays next to the topic name. */}
      <button
        className={`flex min-h-13 min-w-0 max-w-220 flex-1 cursor-pointer items-center gap-4 border-l-[3px] py-2.5 pl-4.75 text-left max-[640px]:flex-wrap ${
          kind === 'worse' ? 'border-[#f63b56]' : 'border-transparent'
        }`}
        onClick={() => onSelect?.(row.id)}
        type="button"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="min-w-0 truncate text-[14px] text-[#14181f]" title={row.label}>
              {row.label}
            </span>
            {row.violations > 0 ? (
              <ViolationTooltip count={row.violations} scope="topic">
                <span className="flex items-center gap-1 text-[12px] font-medium text-[#e0507a]">
                  <TriangleAlert className="shrink-0" size={14} />
                  {row.violations} possible violation
                  {row.violations === 1 ? '' : 's'}
                </span>
              </ViolationTooltip>
            ) : null}
            {row.complaintCounts ? (
              <span className="flex shrink-0 items-center gap-1 text-[12px] font-medium text-[#726f6f]">
                {/* Arrow only for a real move in share of mentions; plain numbers are context. */}
                {row.mentionsTrend === 'up' ? <TrendingUp className="shrink-0" size={14} /> : null}
                {row.mentionsTrend === 'down' ? <TrendingDown className="shrink-0" size={14} /> : null}
                {row.kind === 'new'
                  ? `${row.complaintCounts.current.total} mentions`
                  : `${row.complaintCounts.previous.total} → ${row.complaintCounts.current.total} mentions`}
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
        <ComplaintsDumbbell kind={kind} row={row} />
      </button>
      {onOpen ? (
        <button
          aria-label={`View feedback for ${row.label}`}
          className="ml-auto flex w-28 shrink-0 cursor-pointer items-center justify-end gap-1 border-0 bg-transparent p-0 text-[12px] font-semibold text-[#1e55c5] hover:underline"
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

function WhatChangedGroup({
  kind,
  title,
  Icon,
  tone,
  rows,
  onTopicSelect,
  onTopicOpen,
}: (typeof GROUPS)[number] & {
  rows: WhatChangedRow[]
  onTopicSelect?: (id: string) => void
  onTopicOpen?: (id: string) => void
}) {
  const [showAll, setShowAll] = useState(false)
  const shown = showAll ? rows : rows.slice(0, WHAT_CHANGED_PREVIEW)
  const heading = (
    <>
      <Icon className="shrink-0" size={15} />
      {title}
      <span className="font-medium text-[#929292]">{rows.length}</span>
    </>
  )
  const list = (
    <>
      <ul className="m-0 flex list-none flex-col p-0">
        {shown.map((row) => (
          <WhatChangedItem key={row.id} onOpen={onTopicOpen} onSelect={onTopicSelect} row={row} />
        ))}
      </ul>
      {rows.length > WHAT_CHANGED_PREVIEW ? (
        <button
          className="mt-1 cursor-pointer self-start border-0 bg-transparent px-5.5 py-0 text-[12px] font-semibold text-[#1e55c5] hover:underline"
          onClick={() => setShowAll((v) => !v)}
          type="button"
        >
          {showAll ? 'Show less' : `Show all ${rows.length}`}
        </button>
      ) : null}
    </>
  )
  const headingClass = `m-0 flex items-center gap-1.5 px-5.5 pt-3 pb-1 text-[13px] font-semibold ${tone}`

  // Steady rows only add violations Themes already lists, so they start folded away.
  if (kind === 'steady') {
    return (
      <Collapsible className="flex flex-col">
        <CollapsibleTrigger
          className={`${headingClass} group cursor-pointer border-0 bg-transparent text-left`}
        >
          <ChevronRight
            className="shrink-0 transition-transform group-data-[state=open]:rotate-90"
            size={15}
          />
          {heading}
        </CollapsibleTrigger>
        <CollapsibleContent className="flex flex-col">{list}</CollapsibleContent>
      </Collapsible>
    )
  }
  return (
    <div className="flex flex-col">
      <h3 className={headingClass}>{heading}</h3>
      {list}
    </div>
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
              The latest full period against the one before. Topics are listed when their complaints clearly
              rise or fall, not just by chance, or when they&apos;re new. Click a topic to see it on the
              chart.
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
          <p className="m-0 px-5.5 text-[14px] leading-5 text-[#14181f]">{whatChangedSummary(data.rows)}</p>
          <div className="mt-2 flex items-end gap-4 px-5.5 text-[12px] font-medium text-[#929292] max-[640px]:hidden">
            {/* Same cap as a row's button (minus its 22px left inset), so columns line up. */}
            <span className="flex min-w-0 max-w-[858px] flex-1 items-end gap-4">
              <span className="min-w-0 flex-1">Topic</span>
              <span className="flex w-44 shrink-0 flex-col gap-0.5">
                {/* Legend for the dumbbell marks: fill tells them apart, not colour. */}
                <span className="flex items-center justify-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1">
                    <span
                      aria-hidden="true"
                      className="size-2.5 rounded-full border-2 border-[#929292] bg-white"
                    />
                    Before
                  </span>
                  <span className="flex items-center gap-1">
                    <span
                      aria-hidden="true"
                      className="size-2.5 rounded-full border-2 border-[#929292] bg-[#929292]"
                    />
                    Now
                  </span>
                </span>
                <span className="flex justify-between">
                  <span>0%</span>
                  <span>Complaints</span>
                  <span>100%</span>
                </span>
              </span>
            </span>
            {onTopicOpen ? <span aria-hidden="true" className="w-28 shrink-0" /> : null}
          </div>
          {GROUPS.map((group) => {
            const rows = data.rows.filter((row) => (row.kind ?? 'steady') === group.kind)
            return rows.length > 0 ? (
              <WhatChangedGroup
                {...group}
                key={group.kind}
                onTopicOpen={onTopicOpen}
                onTopicSelect={onTopicSelect}
                rows={rows}
              />
            ) : null
          })}
        </>
      )}
    </section>
  )
}

function TimelineCard({
  trend,
  pinned,
  onPinnedChange,
  onTopicSelect,
}: {
  trend: FormTrendAnalytics
  pinned: string | null
  onPinnedChange: (id: string | null) => void
  /** Charts + pins a topic that isn't on the chart yet. */
  onTopicSelect?: (id: string) => void
}) {
  const events = trend.timelineEvents
  // availableTopics covers every in-window topic, not only the charted ones.
  const labelById = new Map(trend.availableTopics.map((entry) => [entry.id, entry.label]))
  const colorById = topicColorMap(trend.topicVolumeSeries)
  // Same wording as the chart's x-axis (and What changed's "Week of …").
  const periodOf = (index: number) => {
    const label = String(trend.volumeSeries[index]?.label ?? '')
    return trend.bucket === 'week' ? `Week of ${label}` : label
  }
  return (
    <section className="flex flex-col gap-3 rounded-[15px] border border-[#f3f4f5] bg-white px-5.75 py-3">
      <h2 className="m-0 text-[16px] leading-9.25 font-semibold tracking-[0.16px] text-black">
        Timeline of Key Events
      </h2>
      {events.length === 0 ? (
        <p className="m-0 pb-3 text-[12px] tracking-[0.12px] text-[#73777e]">No unusual spikes in this range.</p>
      ) : (
        <ol className="m-0 flex list-none flex-col p-0">
          {events.map((event, index) => {
            const label = labelById.get(event.topicId) ?? 'Untitled topic'
            const isPinned = pinned === event.topicId
            const color = colorById.get(event.topicId)
            return (
              <li className="flex gap-4" key={event.id}>
                <div className="flex flex-col items-center">
                  <span
                    className="mt-1.5 size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: color ?? '#c9cfdb' }}
                  />
                  {index < events.length - 1 ? <span className="w-0.5 flex-1 rounded-full bg-[#c9cfdb]" /> : null}
                </div>
                <div className="flex-1 pb-4">
                  <button
                    aria-pressed={isPinned}
                    className={`-mx-2 -my-1 flex w-[calc(100%+1rem)] cursor-pointer items-start justify-between gap-4 rounded-lg border-0 px-2 py-1 text-left transition-colors ${
                      isPinned ? 'bg-[#eef3fd]' : 'bg-transparent hover:bg-[#f7f8fb]'
                    }`}
                    onClick={() =>
                      color ? onPinnedChange(isPinned ? null : event.topicId) : onTopicSelect?.(event.topicId)
                    }
                    title={
                      isPinned ? 'Pinned — click to unpin' : color ? 'Highlight on Topic Trends' : 'Add to Topic Trends'
                    }
                    type="button"
                  >
                    <div className="flex min-w-0 flex-col">
                      <p className="m-0 truncate text-[14px] font-semibold tracking-[0.14px] text-black">{label}</p>
                      <p className="m-0 text-[12px] tracking-[0.12px] text-black">
                        {periodOf(event.bucketIndex)} · usually ~{event.usual}
                        {color ? null : <span className="text-[#73777e]"> · not on chart</span>}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end">
                      <span className="flex items-center gap-0.5 text-[14px] font-semibold tracking-[0.14px] text-[#f63b56]">
                        <ArrowUp size={15} />
                        {event.count - event.usual}
                      </span>
                      <span className="text-[10px] tracking-[0.1px] text-[#73777e]">{event.count} mentions</span>
                    </div>
                  </button>
                </div>
              </li>
            )
          })}
        </ol>
      )}
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
          spikes={trend.timelineEvents}
          summaries={trend.topicSummaries ?? []}
        />
      </div>

      <div data-tour="trend-emerging">
        <TimelineCard
          onPinnedChange={onPinnedChange}
          onTopicSelect={onTopicSelect}
          pinned={pinnedTopic}
          trend={trend}
        />
      </div>

      <div data-tour="trend-movement">
        <WhatChangedCard
          data={trend.whatChanged ?? null}
          onTopicOpen={onTopicOpen}
          onTopicSelect={onTopicSelect}
        />
      </div>
    </div>
  )
}
