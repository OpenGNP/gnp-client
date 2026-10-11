import { ArrowRight, MessageCircle, Sparkles, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps } from 'recharts'

import type { TopicKeyword, TopicSentiment } from '../../data/dashboardAnalytics'
import { SENTIMENT_KEYS, sharesOf } from '../../lib/sentimentTrendSummary'
import { cn } from '../../lib/utils'
import type { DemographicFilterGroup } from './FeedbackFilter'
import { FeedbackSegmentSection } from './FeedbackSegmentSection'
import { PeriodSentimentTooltip } from './PeriodSentimentTooltip'
import { SentimentGauge } from './SentimentGauge'
import { percentOf, SENTIMENT_SCORE_OUT_OF, sentimentScore } from './sentimentScore'
import { SENTIMENT_COLORS } from './sentimentColors'

/** A volume bucket as the bars draw it: the sentiment split, plus anything unsplit. */
type VolumeBar = {
  index: number
  label: string
  value: number
  negative: number
  neutral: number
  positive: number
  /** Mentions with no split (an older server) — drawn as a plain bar. */
  unsplit: number
  /** Change in mentions vs the bucket before; null for the first one. */
  delta: number | null
}

function toVolumeBars(series: NonNullable<TopicSentiment['volumeSeries']>): VolumeBar[] {
  return series.map((point, i) => {
    const negative = point.negative ?? 0
    const neutral = point.neutral ?? 0
    const positive = point.positive ?? 0
    const previous = i > 0 ? series[i - 1] : undefined
    return {
      index: i,
      label: point.label,
      value: point.value,
      negative,
      neutral,
      positive,
      unsplit: Math.max(0, point.value - negative - neutral - positive),
      delta: previous ? point.value - previous.value : null,
    }
  })
}

function VolumeTooltip({
  active,
  payload,
  selectedIndex,
  canSelect,
}: TooltipContentProps & { selectedIndex: number | null; canSelect: boolean }) {
  const bar = payload?.[0]?.payload as VolumeBar | undefined
  if (!active || !bar) {
    return null
  }
  const note =
    !canSelect || bar.value === 0
      ? undefined
      : bar.index === selectedIndex
        ? 'Click to show every period'
        : "Click to see this period's feedback"
  // Mentions from an older server have no split: show the count, not a fake 0/0/0.
  if (bar.unsplit > 0) {
    return (
      <PeriodSentimentTooltip
        delta={bar.delta}
        label={bar.label}
        mentions={bar.value}
        note={note}
        shares={{ negative: 0, neutral: 0, positive: 0 }}
      />
    )
  }
  return (
    <PeriodSentimentTooltip
      counts={bar}
      delta={bar.delta}
      label={bar.label}
      note={note}
      shares={sharesOf(bar)}
    />
  )
}

const KEYWORD_SIZE_CLASSES: Record<TopicKeyword['weight'], string> = {
  1: 'text-[12px] font-medium text-[#7c93d6]',
  2: 'text-[15px] font-semibold text-[#3f6bd1]',
  3: 'text-[20px] font-bold text-[#1e55c5]',
}

// Matches FormDetailTabs' h-12.5 (50px) — the panel starts right below it and
// closes that gap as FormDetailTabs scrolls out of view, instead of overlapping it.
const NAV_HEIGHT = 50

function getTopOffset() {
  return Math.max(0, NAV_HEIGHT - window.scrollY)
}

export type TopicDetailPanelProps = {
  topic: TopicSentiment
  /** All demographic questions/answers on the form, plus the page-level selection (see FeedbackSegmentSection). */
  demographicFilters?: DemographicFilterGroup[]
  mainDemoSelection?: Record<string, string[]>
  onClose: () => void
  /** Opens the Trend tab with this topic charted and pinned, to compare it with others. */
  onCompareInTrend?: () => void
  /** The dashboard's "Hide names" toggle. */
  hideNames?: boolean
  width: number | null
}

export function TopicDetailPanel({
  topic,
  onClose,
  onCompareInTrend,
  hideNames,
  width,
  demographicFilters,
  mainDemoSelection,
}: TopicDetailPanelProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [topOffset, setTopOffset] = useState(getTopOffset)

  useEffect(() => {
    let innerFrame = 0
    const outerFrame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(() => setIsVisible(true))
    })
    return () => {
      cancelAnimationFrame(outerFrame)
      cancelAnimationFrame(innerFrame)
    }
  }, [])

  useEffect(() => {
    let frame = 0
    const handleScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setTopOffset(getTopOffset()))
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  const feedbackPoints = topic.negative + topic.neutral + topic.positive
  const score = sentimentScore(topic)

  const volumeBars = toVolumeBars(topic.volumeSeries ?? [])
  // Clicking a bar narrows the feedback below to that period. Needs every point's
  // bucket from the server (absent on older ones).
  const canSelectPeriod =
    topic.feedbackSegment.length > 0 && topic.feedbackSegment.every((point) => point.volumeBucket !== undefined)
  const [picked, setPicked] = useState<{ index: number; label: string } | null>(null)
  // Dropped if a refetch (range/filter change) moved the buckets out from under it.
  const period = picked && volumeBars[picked.index]?.label === picked.label ? picked : null
  const togglePeriod = (index: number) => {
    const bar = volumeBars[index]
    if (!bar || bar.value === 0) return
    setPicked(period?.index === index ? null : { index, label: bar.label })
  }

  return (
    <aside
      className={cn(
        'fixed right-0 bottom-0 z-50 flex w-full flex-col gap-5 overflow-y-auto border-l border-[#e9eaed] bg-white p-10 transition-[transform,opacity] duration-300 ease-out',
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0',
      )}
      style={{ top: topOffset, ...(width !== null ? { width } : {}) }}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="m-0 text-[18px] font-bold text-black">{topic.label}</h2>
          <button
            aria-label="Close topic details"
            className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-[6px] text-black transition-colors hover:bg-[#f7f8fb]"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#929292]">
          <MessageCircle size={14} />
          {feedbackPoints} Feedback Points
          <span className="size-1 shrink-0 rounded-full bg-[#929292]" />
          {topic.percentOfTotal}% of total feedback
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-[10px] bg-[#f5f7fd] p-4">
        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-black">
          <Sparkles className="text-[#1e55c5]" size={16} />
          AI summary
        </div>
        <p className="m-0 text-[12px] leading-[1.6] text-[#3f4045]">{topic.aiSummary}</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex min-w-45 flex-1 flex-col gap-3 rounded-[10px] border border-[#e9eaed] p-4">
          <p className="m-0 text-[12px] font-medium text-[#929292]">Sentiment analysis</p>
          <div className="flex flex-1 items-center justify-center gap-3">
            <SentimentGauge
              negative={topic.negative}
              neutral={topic.neutral}
              outOf={SENTIMENT_SCORE_OUT_OF}
              positive={topic.positive}
              score={score}
            />
            <div className="flex flex-col gap-1.5 text-[12px]">
              <span className="flex items-center gap-1.5">
                <span
                  className="size-1.75 shrink-0 rounded-full"
                  style={{ backgroundColor: SENTIMENT_COLORS.negative }}
                />
                <span className="text-[#929292]">
                  Negative:{' '}
                  <span className="text-[#14181f]">
                    {percentOf(topic.negative, feedbackPoints)}%
                  </span>
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="size-1.75 shrink-0 rounded-full"
                  style={{ backgroundColor: SENTIMENT_COLORS.neutral }}
                />
                <span className="text-[#929292]">
                  Neutral:{' '}
                  <span className="text-[#14181f]">
                    {percentOf(topic.neutral, feedbackPoints)}%
                  </span>
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="size-1.75 shrink-0 rounded-full"
                  style={{ backgroundColor: SENTIMENT_COLORS.positive }}
                />
                <span className="text-[#929292]">
                  Positive:{' '}
                  <span className="text-[#14181f]">
                    {percentOf(topic.positive, feedbackPoints)}%
                  </span>
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex min-w-45 flex-1 flex-col gap-3 rounded-[10px] border border-[#e9eaed] p-4">
          <p className="m-0 text-[12px] font-medium text-[#929292]">Keyword</p>
          <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 py-2">
            {topic.keywords.map((keyword) => (
              <span className={KEYWORD_SIZE_CLASSES[keyword.weight]} key={keyword.text}>
                {keyword.text}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-[10px] border border-[#e9eaed] p-4">
        <div className="flex items-center justify-between gap-3">
          {/* Not "Topic Trends": that's the Trend tab's multi-topic line chart. */}
          <p className="m-0 text-[12px] font-medium text-[#929292]">Mentions over time</p>
          {onCompareInTrend ? (
            <button
              className="inline-flex cursor-pointer items-center gap-1 rounded-[6px] border-0 bg-transparent px-1 text-[12px] font-medium text-[#1e55c5] transition-colors hover:text-[#163f94] hover:underline"
              onClick={onCompareInTrend}
              type="button"
            >
              Compare with other topics
              <ArrowRight size={13} />
            </button>
          ) : null}
        </div>
        <div className="h-45 w-full">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart
              barCategoryGap="28%"
              data={volumeBars}
              margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
              // The whole column is the click target, so thin segments are easy to hit.
              onClick={
                canSelectPeriod
                  ? (state) => {
                      const index = Number(state.activeTooltipIndex)
                      if (Number.isInteger(index)) togglePeriod(index)
                    }
                  : undefined
              }
              style={canSelectPeriod ? { cursor: 'pointer' } : undefined}
            >
              <CartesianGrid stroke="#f0f1f4" vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="label"
                interval={0}
                tick={{ fill: '#929292', fontSize: 11 }}
                tickLine={false}
              />
              <YAxis
                axisLine={false}
                allowDecimals={false}
                tick={{ fill: '#929292', fontSize: 11 }}
                tickLine={false}
              />
              <Tooltip
                content={(props) => (
                  <VolumeTooltip {...props} canSelect={canSelectPeriod} selectedIndex={period?.index ?? null} />
                )}
                cursor={{ fill: '#f5f7fd' }}
                isAnimationActive={false}
              />
              {/* Bar height is still the mention count; the stack shows what those
                  mentions felt like. Negative sits at the bottom so it's the easiest
                  part to compare across periods. */}
              {[...SENTIMENT_KEYS, 'unsplit' as const].map((key) => (
                <Bar
                  dataKey={key}
                  fill={key === 'unsplit' ? '#1e55c5' : SENTIMENT_COLORS[key]}
                  isAnimationActive={false}
                  key={key}
                  stackId="volume"
                >
                  {/* With a period picked, the other bars fade back. */}
                  {volumeBars.map((bar) => (
                    <Cell
                      fillOpacity={period === null || period.index === bar.index ? 1 : 0.3}
                      key={bar.index}
                    />
                  ))}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <FeedbackSegmentSection
        demographicFilters={demographicFilters}
        feedbackSegment={topic.feedbackSegment}
        hideNames={hideNames}
        key={JSON.stringify(mainDemoSelection ?? {})}
        mainDemoSelection={mainDemoSelection}
        onClearPeriod={() => setPicked(null)}
        period={period}
      />
    </aside>
  )
}
