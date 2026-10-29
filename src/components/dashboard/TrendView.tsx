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
import { useRef, useState } from 'react'

import type {
  FormTrendAnalytics,
  TrendTimelineEvent,
  WhatChanged,
  WhatChangedRow,
} from '../../data/dashboardAnalytics'
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
/** Spikes shown before "Show all". */
const TIMELINE_PREVIEW = 5

const BEFORE_GRAY = '#929292'

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
  const dot = 'absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white'
  // Same marks as on the track, so the tooltip doubles as its legend.
  const legendDot = (filled: boolean, border = color) => (
    <span
      aria-hidden="true"
      className="inline-block size-2.5 shrink-0 rounded-full border-2"
      style={{ borderColor: border, backgroundColor: filled ? color : 'white' }}
    />
  )

  return (
    <HoverTooltip>
      <TooltipTrigger asChild>
        <span className="flex w-44 shrink-0 flex-col items-stretch gap-0.5">
          {/* px = dot radius, so dots at 0% / 100% stay inside the column. */}
          <span className="px-1.5">
            <span aria-hidden="true" className="relative block h-5">
              <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#f0f1f4]" />
              <span className="absolute top-1/2 left-1/2 h-2.5 w-px -translate-y-1/2 bg-[#d9dce3]" />
              <span
                className="absolute top-1/2 -translate-y-1/2 border-t-[3px]"
                style={{
                  left: `${lo}%`,
                  width: `${hi - lo}%`,
                  borderColor: color,
                  borderStyle: tentative ? 'dashed' : 'solid',
                }}
              />
              {isNew ? null : (
                // Grey "before" vs coloured "now", so the direction reads without the legend.
                <span
                  className={`${dot} border-2 bg-white`}
                  style={{ left: `${previous}%`, borderColor: BEFORE_GRAY }}
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
          {/* Counts, not %: the dots already show %, and counts reveal a small sample. */}
          <span className="text-center text-[11px] text-[#726f6f] tabular-nums">
            {counts
              ? `${isNew ? '—' : `${counts.previous.negative} of ${counts.previous.total}`} → ${counts.current.negative} of ${counts.current.total}`
              : `${isNew ? '—' : `${previous}%`} → ${current}%`}
          </span>
        </span>
      </TooltipTrigger>
      <TooltipContent className="leading-4.5 text-[#3f4045]" side="top">
        <p className="m-0 font-semibold text-[#14181f]">Complaints</p>
        {counts ? (
          <>
            <p className="m-0 flex items-center gap-1.5">
              {isNew ? null : legendDot(false, BEFORE_GRAY)}
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
      className={`group flex items-center gap-4 pr-5.5 transition-colors max-[640px]:flex-wrap ${
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
          // Shown on row hover/focus; always on touch screens, which can't hover.
          className="ml-auto flex w-28 shrink-0 cursor-pointer items-center justify-end gap-1 border-0 bg-transparent p-0 text-[12px] font-semibold text-[#1e55c5] opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:underline [@media(hover:none)]:opacity-100"
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

  // Steady rows only add violations Themes already lists, and Improving needs no action,
  // so both start folded away.
  if (kind === 'steady' || kind === 'better') {
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
      {/* Same columns as the table header, so the dumbbell legend sits right above "Complaints". */}
      <div className="flex items-center gap-4 px-5.5">
        <div className="flex min-w-0 max-w-[858px] flex-1 items-center gap-4">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1.5">
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
                  The latest full period against the one before. Topics are listed when their complaints
                  clearly rise or fall, not just by chance, or when they&apos;re new. Click a topic to see it
                  on the chart.
                </TooltipContent>
              </HoverTooltip>
            </div>
            {data ? (
              <span className="text-[12px] font-medium text-[#726f6f]">
                {data.currentLabel} compared with {data.previousLabel}
              </span>
            ) : null}
          </div>
          {data && data.rows.length > 0 ? (
            <span className="flex w-44 shrink-0 items-center justify-center gap-3 text-[11px] font-medium text-[#929292] max-[640px]:hidden">
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
          ) : null}
        </div>
        {onTopicOpen ? <span aria-hidden="true" className="w-28 shrink-0 max-[640px]:hidden" /> : null}
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
          <div className="mt-2 flex items-center gap-4 px-5.5 text-[12px] font-medium text-[#929292] max-[640px]:hidden">
            {/* Same cap as a row's button (minus its 22px left inset), so columns line up. */}
            <span className="flex min-w-0 max-w-[858px] flex-1 items-center gap-4">
              <span className="min-w-0 flex-1">Topic</span>
              <span className="flex w-44 shrink-0 justify-between">
                <span>0%</span>
                <span>Complaints</span>
                <span>100%</span>
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
  const [showAll, setShowAll] = useState(false)
  const events = trend.timelineEvents
  // The server ranks by spike size; show the biggest few, in time order.
  const shown = (showAll ? events : events.slice(0, TIMELINE_PREVIEW)).toSorted((a, b) =>
    b.date.localeCompare(a.date),
  )
  // availableTopics covers every in-window topic, not only the charted ones.
  const labelById = new Map(trend.availableTopics.map((entry) => [entry.id, entry.label]))
  const colorById = topicColorMap(trend.topicVolumeSeries)
  // Same wording as the chart's x-axis (and What changed's "Week of …").
  const periodOf = (index: number) => {
    const label = String(trend.volumeSeries[index]?.label ?? '')
    return trend.bucket === 'week' ? `Week of ${label}` : label
  }
  // Newest first, so a period's spikes are already next to each other.
  const groups: { bucketIndex: number; events: TrendTimelineEvent[] }[] = []
  for (const event of shown) {
    const last = groups.at(-1)
    if (last?.bucketIndex === event.bucketIndex) last.events.push(event)
    else groups.push({ bucketIndex: event.bucketIndex, events: [event] })
  }
  return (
    <section className="flex flex-col gap-3 rounded-[15px] border border-[#f3f4f5] bg-white px-5.75 py-3">
      <h2 className="m-0 text-[16px] leading-9.25 font-semibold tracking-[0.16px] text-black">
        Timeline of Key Events
      </h2>
      {events.length === 0 ? (
        <p className="m-0 pb-3 text-[12px] tracking-[0.12px] text-[#73777e]">
          No unusual spikes in this range.
        </p>
      ) : (
        <ol className="relative m-0 flex list-none flex-col gap-2 p-0 pb-2">
          <span
            aria-hidden="true"
            className="absolute top-2 bottom-6 left-1 w-0.5 rounded-full bg-[#c9cfdb]"
          />
          {groups.map((group) => (
            <li className="flex flex-col" key={group.bucketIndex}>
              <p className="m-0 py-0.5 pl-6.5 text-[12px] font-semibold tracking-[0.12px] text-[#73777e]">
                {periodOf(group.bucketIndex)}
              </p>
              <ul className="m-0 flex list-none flex-col p-0">
                {group.events.map((event) => {
                  const label = labelById.get(event.topicId) ?? 'Untitled topic'
                  const isPinned = pinned === event.topicId
                  const color = colorById.get(event.topicId)
                  return (
                    <li className="relative flex items-center gap-4" key={event.id}>
                      <span
                        aria-hidden="true"
                        className="size-2.5 shrink-0 rounded-full ring-2 ring-white"
                        style={{ backgroundColor: color ?? '#c9cfdb' }}
                      />
                      <HoverTooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <button
                            aria-pressed={isPinned}
                            className={`-mx-2 flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-3 rounded-lg border-0 px-2 py-1 text-left transition-colors ${
                              isPinned ? 'bg-[#eef3fd]' : 'bg-transparent hover:bg-[#f7f8fb]'
                            }`}
                            onClick={() =>
                              color
                                ? onPinnedChange(isPinned ? null : event.topicId)
                                : onTopicSelect?.(event.topicId)
                            }
                            type="button"
                          >
                            <span className="min-w-0 truncate text-[14px] text-[#14181f]">{label}</span>
                            {/* Neutral, not red: more mentions isn't good or bad by itself. */}
                            <span className="flex shrink-0 items-center gap-0.5 text-[14px] font-semibold tracking-[0.14px] text-[#1e55c5]">
                              <ArrowUp size={15} />
                              {event.count - event.usual}
                              <span className="sr-only">
                                {' '}
                                more mentions than usual ({event.count}, usually about {event.usual})
                              </span>
                            </span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          className="max-w-64 whitespace-normal leading-4.5 text-[#3f4045]"
                          side="left"
                        >
                          <span className="block font-semibold">{label}</span>
                          {event.count} mentions, usually ~{event.usual}
                          <span className="block text-[#73777e]">
                            {isPinned
                              ? 'Pinned. Click to unpin'
                              : color
                                ? 'Click to highlight on Topic Trends'
                                : 'Not on the chart. Click to add it'}
                          </span>
                        </TooltipContent>
                      </HoverTooltip>
                    </li>
                  )
                })}
              </ul>
            </li>
          ))}
        </ol>
      )}
      {events.length > TIMELINE_PREVIEW ? (
        <button
          className="-mt-2 cursor-pointer self-start border-0 bg-transparent p-0 text-[12px] font-semibold text-[#1e55c5] hover:underline"
          onClick={() => setShowAll((v) => !v)}
          type="button"
        >
          {showAll ? 'Show less' : `Show all ${events.length}`}
        </button>
      ) : null}
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
  const chartRef = useRef<HTMLDivElement>(null)
  // The Timeline sits below What changed, so bring the chart into view to show the pin.
  const pinFromTimeline = (id: string | null) => {
    onPinnedChange(id)
    if (id) chartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="flex flex-col gap-4.5">
      {/* Full width: volume lines + the sentiment strip under them, and the topic
          detail side panel. */}
      <div data-tour="trend-chart" ref={chartRef}>
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

      {/* Wide screens: Timeline is a sticky rail beside What changed; else it stacks below. */}
      <div className="flex flex-col gap-4.5 min-[1280px]:grid min-[1280px]:grid-cols-[minmax(0,1fr)_300px] min-[1280px]:items-start">
        <div data-tour="trend-movement">
          <WhatChangedCard
            data={trend.whatChanged ?? null}
            onTopicOpen={onTopicOpen}
            onTopicSelect={onTopicSelect}
          />
        </div>

        <div
          className="min-[1280px]:sticky min-[1280px]:top-4 min-[1280px]:max-h-[calc(100vh-2rem)] min-[1280px]:overflow-y-auto"
          data-tour="trend-emerging"
        >
          <TimelineCard
            onPinnedChange={pinFromTimeline}
            onTopicSelect={onTopicSelect}
            pinned={pinnedTopic}
            trend={trend}
          />
        </div>
      </div>
    </div>
  )
}
