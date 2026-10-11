import {
  ArrowDown,
  ArrowUp,
  Frown,
  Info,
  Minus,
  Smile,
  Sparkle,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'

import type {
  EmergingIssue,
  FormTrendAnalytics,
  TopicMovement,
  TrendTimelineEvent,
} from '../../data/dashboardAnalytics'
import { Tooltip as HoverTooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { TopicTrendsCard } from './TopicTrendsCard'

function formatEventDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function SentimentDelta({
  face,
  value,
}: {
  face: 'positive' | 'negative'
  value: number
}) {
  const Face = face === 'positive' ? Smile : Frown
  const Arrow = value > 0 ? ArrowUp : value < 0 ? ArrowDown : Minus
  const tone = face === 'positive' ? 'text-[#269d42]' : 'text-[#f63b56]'

  return (
    <div className="flex w-8.5 flex-col items-center gap-0.5">
      <Face className={`${tone}`} size={15} />
      <span className={`flex items-center gap-0.5 text-[10px] font-medium tracking-[0.1px] ${tone}`}>
        <Arrow size={12} />
        {Math.abs(value)}
      </span>
    </div>
  )
}

function VolumeChangeIndicator({ row }: { row: TopicMovement }) {
  if (row.status === 'new') {
    return (
      <span
        className="flex items-center gap-0.5 text-[12px] font-semibold tracking-[0.12px] text-[#1e55c5]"
      >
        <Sparkle size={13} />
        New
      </span>
    )
  }

  if (row.status === 'inactive') {
    return <span className="text-[12px] font-semibold tracking-[0.12px] text-[#929292]">—</span>
  }

  if (row.delta === 0) {
    return (
      <span
        className="flex items-center gap-0.5 text-[12px] font-semibold tracking-[0.12px] text-[#929292]"
      >
        <Minus size={15} />
        0
      </span>
    )
  }

  const Arrow = row.delta > 0 ? ArrowUp : ArrowDown
  // Neutral on purpose: more mentions isn't good or bad by itself (it may be more
  // complaints) — the sentiment faces beside it carry the good/bad colour.
  return (
    <span
      className="flex items-center gap-0.5 text-[12px] font-semibold tracking-[0.12px] text-[#14181f]"
    >
      <Arrow size={15} />
      {row.delta > 0 ? '+' : ''}
      {row.delta}
    </span>
  )
}

function formatSigned(value: number) {
  return value > 0 ? `+${value}` : value < 0 ? `−${Math.abs(value)}` : '0'
}

/** Hover detail for a Rising/Declining row: now vs before, for mentions and sentiment. */
function MovementTooltipBody({ row, comparisonLabel }: { row: TopicMovement; comparisonLabel: string }) {
  const hasCounts = row.currentPositive !== undefined && row.previousPositive !== undefined
  const lines = [
    { label: 'Mentions', now: row.currentMentions, before: row.previousMentions, change: row.delta },
    {
      label: 'Positive',
      now: row.currentPositive,
      before: row.previousPositive,
      change: row.positiveDelta,
    },
    {
      label: 'Negative',
      now: row.currentNegative,
      before: row.previousNegative,
      change: row.negativeDelta,
    },
  ]
  return (
    <div className="flex flex-col gap-1.5">
      <div>
        <p className="m-0 max-w-72 font-semibold whitespace-normal text-[#14181f]">{row.label}</p>
        <p className="m-0 text-[11px] text-[#929292]">{comparisonLabel}</p>
      </div>
      <table className="border-collapse text-[12px]">
        <thead>
          <tr className="text-[10px] text-[#929292]">
            <th className="pr-4 text-left font-medium" scope="col">
              <span className="sr-only">Metric</span>
            </th>
            {hasCounts ? (
              <>
                <th className="pr-3 text-right font-medium" scope="col">Now</th>
                <th className="pr-3 text-right font-medium" scope="col">Before</th>
              </>
            ) : null}
            <th className="text-right font-medium" scope="col">Change</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.label}>
              <th className="pr-4 text-left font-medium text-[#726f6f]" scope="row">
                {line.label}
              </th>
              {hasCounts ? (
                <>
                  <td className="pr-3 text-right font-semibold text-[#14181f]">{line.now}</td>
                  <td className="pr-3 text-right text-[#726f6f]">{line.before}</td>
                </>
              ) : null}
              <td className="text-right font-semibold text-[#14181f]">{formatSigned(line.change)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {row.status === 'new' ? (
        <p className="m-0 text-[11px] text-[#1e55c5]">New — not mentioned before this period</p>
      ) : null}
    </div>
  )
}

function TopicMovementRow({ row, comparisonLabel }: { row: TopicMovement; comparisonLabel: string }) {
  return (
    <div className="flex items-center gap-2 py-2.5 pr-1 pl-2.5">
      {/* Long AI-generated names wrap to two lines before truncating; the full name
          is on hover (and at the top of the numbers' tooltip). */}
      <span
        className="line-clamp-2 min-w-0 flex-1 text-[12px] leading-4 font-semibold tracking-[0.12px] break-words text-black"
        title={row.label}
      >
        {row.label}
      </span>
      <HoverTooltip>
        <TooltipTrigger asChild>
          {/* Focusable so the detail is reachable by keyboard too. */}
          <div
            aria-label={`${row.label}: ${row.currentMentions} mentions now, ${row.previousMentions} before`}
            className="flex w-36 shrink-0 cursor-default items-center justify-between rounded-[6px] outline-none focus-visible:ring-2 focus-visible:ring-[#1e55c5]/40"
            tabIndex={0}
          >
            <VolumeChangeIndicator row={row} />
            <div className="flex items-center gap-1">
              <SentimentDelta face="positive" value={row.positiveDelta} />
              <SentimentDelta face="negative" value={row.negativeDelta} />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent align="end" side="top">
          <MovementTooltipBody comparisonLabel={comparisonLabel} row={row} />
        </TooltipContent>
      </HoverTooltip>
    </div>
  )
}

function TopicMovementCard({
  title,
  icon,
  comparisonLabel,
  rows,
  rule,
  direction,
}: {
  title: string
  icon: React.ReactNode
  comparisonLabel: string
  rows: TopicMovement[]
  rule: { minDelta: number; limit: number }
  direction: 'rising' | 'declining'
}) {
  return (
    <section className="flex h-full flex-col gap-2 rounded-[15px] border border-[#f3f4f5] bg-white px-2 py-2">
      <div className="flex h-7 items-center gap-2.5 pl-2.25">
        {icon}
        <h3 className="m-0 text-[16px] leading-9.25 font-semibold tracking-[0.16px] text-black">
          {title}
        </h3>
        <HoverTooltip>
          <TooltipTrigger asChild>
            <button
              aria-label={`How ${title} is worked out`}
              className="flex size-5 cursor-help items-center justify-center rounded-full text-[#929292] transition-colors hover:text-[#3f4045]"
              type="button"
            >
              <Info size={15} />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-70 whitespace-normal leading-4.5 text-[#3f4045]" side="top">
            Topics whose mentions went {direction === 'rising' ? 'up' : 'down'} by at least{' '}
            {rule.minDelta} ({comparisonLabel}). The top {rule.limit} are shown. Hover a row's numbers
            for the details.
          </TooltipContent>
        </HoverTooltip>
      </div>
      {rows.length > 0 ? (
        <div className="flex items-start justify-between gap-2 pr-1 pl-2.5 text-[10px] leading-4.5 font-medium tracking-[0.1px] text-[#73777e]">
          <span className="min-w-0">Topic: Change ({comparisonLabel})</span>
          <div className="flex w-36 shrink-0 items-center justify-between">
            <span>Volume</span>
            <span>Sentiment</span>
          </div>
        </div>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {rows.map((row) => (
          <TopicMovementRow comparisonLabel={comparisonLabel} key={row.id} row={row} />
        ))}
        {/* The card keeps the height of a full list, so say why it isn't full. */}
        {rows.length < rule.limit ? (
          <p className="m-0 flex flex-1 items-center justify-center px-4 py-3 text-center text-[12px] leading-4.5 text-[#929292]">
            {rows.length === 0 ? 'No topics to show' : 'No more topics to show'}
          </p>
        ) : null}
      </div>
    </section>
  )
}

function EmergingIssuesCard({ issues }: { issues: EmergingIssue[] }) {
  return (
    <section className="flex flex-col gap-3 rounded-[15px] border border-[#e9eaed] bg-white px-5.75 py-3">
      <h2 className="m-0 text-[16px] leading-9.25 font-semibold tracking-[0.16px] text-black">
        Emerging / High-Risk Issues
      </h2>
      {issues.map((issue) => (
        <div className="flex items-center justify-between gap-3" key={issue.id}>
          <div className="flex items-center gap-6.25">
            <div className="flex size-13.25 shrink-0 items-center justify-center rounded-[10px] bg-[#fdecec]">
              <TrendingUp className="text-[#f63b56]" size={26} />
            </div>
            <div className="flex flex-col">
              <p className="m-0 text-[14px] font-semibold tracking-[0.14px] text-black">
                {issue.title}
              </p>
              <p className="m-0 text-[12px] tracking-[0.12px] text-black">{issue.description}</p>
            </div>
          </div>
          <span className="flex h-8 shrink-0 items-center justify-center rounded-[5px] bg-[#fee6e8] px-2.5 text-[12px] font-bold tracking-[0.12px] text-[#f63b56]">
            {issue.riskLabel}
          </span>
        </div>
      ))}
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
}

export function TrendView({ trend, topicControl, pinned, onPinnedChange }: TrendViewProps) {
  const movementRule = trend.movementRule ?? { minDelta: 2, limit: 5 }
  // Ignored once it's no longer on the chart (e.g. the topic picker removed it) — or
  // not on it yet, while a "Compare" jump's new topic selection is still loading.
  const pinnedTopic = trend.topicVolumeSeries.some((entry) => entry.id === pinned) ? pinned : null

  return (
    <div className="flex flex-col gap-4.5">
      {/* Full width: volume lines + the sentiment strip under them, and the topic
          detail side panel. */}
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

      {/* Rising | Declining, half the row each. Both take the taller card's height
          (grid stretch), so the shorter one's note fills its spare space. */}
      <div className="grid grid-cols-2 gap-4.5 max-[900px]:grid-cols-1">
        <TopicMovementCard
          comparisonLabel={trend.comparisonLabel}
          direction="rising"
          icon={<TrendingUp className="text-[#1e55c5]" size={22} />}
          rows={trend.risingTopics}
          rule={movementRule}
          title="Rising Topics"
        />
        <TopicMovementCard
          comparisonLabel={trend.comparisonLabel}
          direction="declining"
          icon={<TrendingDown className="text-[#1e55c5]" size={22} />}
          rows={trend.decliningTopics}
          rule={movementRule}
          title="Declining Topics"
        />
      </div>

      {/* items-start: short cards (few issues/events) keep their own height. */}
      <div className="grid grid-cols-2 items-start gap-4.5 max-[900px]:grid-cols-1">
        <EmergingIssuesCard issues={trend.emergingIssues} />
        <TimelineCard events={trend.timelineEvents} />
      </div>
    </div>
  )
}
