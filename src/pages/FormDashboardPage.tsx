import {
  ArrowUp,
  Calendar,
  RefreshCw,
  Tag,
  TrendingUp,
  TriangleAlert,
  Users,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import type { FormThemeAnalytics } from '../api/analytics'
import type { ApiFormDetail } from '../api/forms'
import { formQuery, responsesQuery, themesQuery, trendQuery } from '../api/queries'
import { ActiveFilterBar, type ActiveFilterChip } from '../components/dashboard/ActiveFilterBar'
import { DateRangeFilter } from '../components/dashboard/DateRangeFilter'
import { FeedbackFilter } from '../components/dashboard/FeedbackFilter'
import { ResponseOverviewSection } from '../components/dashboard/ResponseOverviewSection'
import { SentimentGauge } from '../components/dashboard/SentimentGauge'
import { percentOf } from '../components/dashboard/sentimentScore'
import { TopicDetailPanel } from '../components/dashboard/TopicDetailPanel'
import { TopicPicker } from '../components/dashboard/TopicPicker'
import { TopicSentimentCard } from '../components/dashboard/TopicSentimentCard'
import { TrendView } from '../components/dashboard/TrendView'
import { TREND_SERIES_MAX } from '../components/dashboard/trendColors'
import type { DashboardView } from '../components/navigation/DashboardViewTabs'
import { DashboardViewTabs } from '../components/navigation/DashboardViewTabs'
import { FormDetailTabs } from '../components/navigation/FormDetailTabs'
import { ResponseStateChip } from '../components/navigation/ResponseStateChip'
import type { FormTrendAnalytics, TrendBucket, TrendRank } from '../data/dashboardAnalytics'
import { useDetailPanelWidth } from '../hooks/useDetailPanelWidth'
import { useNow } from '../hooks/useNow'
import { ApiError } from '../lib/api'
import { formatRelativeTime } from '../lib/formatRelativeTime'
import { formatDateTime, formStatusBadge } from '../lib/responseWindow'
import { ContentSkeleton } from '../components/skeletons/DashboardSkeleton'
import { Skeleton } from '../components/ui/skeleton'
import { cn } from '../lib/utils'

type BucketChoice = TrendBucket | 'auto'

// 'auto' lets the server size the buckets so the charts get 6–12 x-axis points.
const BUCKETS: { value: BucketChoice; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' },
]

/** `form === null` while it loads: the labels render, the values are placeholders. */
function StatusRow({ form, now }: { form: ApiFormDetail | null; now: number }) {
  return (
    <div className="flex items-center gap-5">
      {form ? (
        <ResponseStateChip
          badge={formStatusBadge(
            form.status,
            {
              acceptingResponses: form.acceptingResponses,
              startDate: form.startDate,
              endDate: form.endDate,
            },
            now,
          )}
        />
      ) : (
        <Skeleton className="h-6.5 w-24 rounded-full" />
      )}
      <span className="inline-flex items-center gap-1.5 text-[12px]">
        <Calendar className="text-[#3f4045]" size={22} strokeWidth={1.8} />
        <span className="font-medium text-[#929292]">Open</span>
        {form ? (
          <span className="font-bold text-[#14181f]">{openRangeLabel(form)}</span>
        ) : (
          <Skeleton className="h-3.5 w-28" />
        )}
      </span>
      <span className="inline-flex items-center gap-1.5 text-[12px]">
        <RefreshCw className="text-[#3f4045]" size={22} strokeWidth={1.8} />
        <span className="font-medium text-[#929292]">Last update</span>
        {form ? (
          <span className="font-bold text-[#14181f]">{formatRelativeTime(form.updatedAt)}</span>
        ) : (
          <Skeleton className="h-3.5 w-16" />
        )}
      </span>
    </div>
  )
}

function StatCard({
  icon,
  iconBgClassName,
  label,
  value,
  deltaLabel,
  deltaClassName,
}: {
  icon: React.ReactNode
  iconBgClassName: string
  label: string
  value: number | string
  /** Omit to hide the delta line entirely. */
  deltaLabel?: string
  deltaClassName: string
}) {
  return (
    <div className="flex h-29.5 w-56 shrink-0 items-center gap-4.5 rounded-[10px] border border-[#e9eaed] bg-white px-3.75 pt-5.5 pb-6.25">
      <div
        className={`flex size-15.25 shrink-0 items-center justify-center rounded-[6px] ${iconBgClassName}`}
      >
        {icon}
      </div>
      <div className="flex min-w-0 flex-col gap-2.5">
        <p className="m-0 truncate text-[12px] font-medium text-[#929292]">{label}</p>
        <p className="m-0 text-[20px] font-bold text-[#14181f]">{value}</p>
        {deltaLabel ? (
          <div className={`flex items-center gap-0.5 text-[12px] font-medium ${deltaClassName}`}>
            <ArrowUp size={15} />
            {deltaLabel}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function UpdatingIndicator() {
  return (
    <span
      aria-live="polite"
      className="inline-flex h-11.25 shrink-0 items-center gap-1.5 self-end text-[13px] font-medium tracking-[0.13px] text-[#726f6f]"
      role="status"
    >
      <RefreshCw className="animate-spin" size={16} />
      Updating…
    </span>
  )
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-60 items-center justify-center rounded-[15px] border border-dashed border-[#d2d8e5] bg-white px-6 py-12 text-center">
      <p className="m-0 max-w-100 text-[14px] leading-6 text-[#726f6f]">{children}</p>
    </div>
  )
}

function openRangeLabel(form: ApiFormDetail): string {
  const start = formatDateTime(form.startDate)
  const end = formatDateTime(form.endDate)
  if (start && end) return `${start} – ${end}`
  if (start) return `From ${start}`
  if (end) return `Until ${end}`
  return 'Anytime'
}

export type FormDashboardPageProps = {
  showSidebarToggle?: boolean
  onToggleSidebar?: () => void
}

export function FormDashboardPage({
  showSidebarToggle = false,
  onToggleSidebar,
}: FormDashboardPageProps) {
  const { projectId } = useParams()
  const formId = Number(projectId)
  const hasValidId = Number.isInteger(formId) && formId > 0

  const [activeView, setActiveView] = useState<DashboardView>('themes')
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const detailPanelWidth = useDetailPanelWidth()
  const now = useNow()

  // Themes + Trend tabs share one date `range`, fetched separately from form/responses
  // so changing it doesn't reload the whole dashboard. `range === null` means "auto" —
  // the server defaults to the span of this form's analysed feedback (earliest →
  // latest submission), so both tabs open on all feedback. Trend also has a `bucket`.
  const [bucket, setBucket] = useState<BucketChoice>('auto')
  const [rank, setRank] = useState<TrendRank>('mentioned')
  // `null` = "let the server auto-pick the top lines for the current rank".
  const [topicSel, setTopicSel] = useState<string[] | null>(null)
  const [range, setRange] = useState<{ from: string; to: string } | null>(null)
  // Themes-tab demographic filter: question label → chosen answers (server-side).
  const [demoSel, setDemoSel] = useState<Record<string, string[]>>({})

  // Which kind of control last changed the trend query — so "Updating…" shows where
  // the change applies: on the Topic Trends card for the topic picker (it only
  // changes that chart's lines), in the filter row for page-wide filters.
  const [trendChangeScope, setTrendChangeScope] = useState<'page' | 'topic-chart'>('page')

  const changeBucket = (next: BucketChoice) => {
    setTrendChangeScope('page')
    setBucket(next)
  }
  const changeRank = (next: TrendRank) => {
    setTrendChangeScope('topic-chart')
    setRank(next)
    setTopicSel(null) // fall back to that rank's auto pick
  }
  const changeTopicSel = (ids: string[]) => {
    setTrendChangeScope('topic-chart')
    setTopicSel(ids)
  }
  const resetTopicSel = () => {
    setTrendChangeScope('topic-chart')
    setTopicSel(null)
  }
  const changeRange = (next: { from: string; to: string }) => {
    setTrendChangeScope('page')
    setRange(next)
  }
  const toggleDemo = (label: string, value: string) => {
    setTrendChangeScope('page')
    setDemoSel((prev) => {
      const current = prev[label] ?? []
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      return { ...prev, [label]: next }
    })
  }
  const clearDemo = () => {
    setTrendChangeScope('page')
    setDemoSel({})
  }
  const resetRange = () => {
    setTrendChangeScope('page')
    setRange(null)
  }

  // Each data source is its own cached query. Changing a filter changes the
  // themes/trend query key; `keepPreviousData` (see api/queries.ts) keeps the old
  // result on screen meanwhile, which `isPlaceholderData` reports as "Updating…".
  const formResult = useQuery({ ...formQuery(formId), enabled: hasValidId })
  const responsesResult = useQuery({ ...responsesQuery(formId), enabled: hasValidId })
  const themesResult = useQuery({
    ...themesQuery(formId, { from: range?.from, to: range?.to, demo: demoSel }),
    enabled: hasValidId,
  })
  const trendResult = useQuery({
    ...trendQuery(formId, {
      from: range?.from,
      to: range?.to,
      bucket: bucket === 'auto' ? undefined : bucket,
      rank,
      topics: topicSel ?? undefined,
      demo: demoSel,
    }),
    enabled: hasValidId,
  })

  const form = formResult.data ?? null
  const responses = responsesResult.data ?? null

  // A failed filter change shouldn't blank the tab: keep the last successful
  // themes/trend for this form on screen (only a *first* themes failure is fatal).
  const [lastGood, setLastGood] = useState<{
    formId: number
    themes: FormThemeAnalytics | null
    trend: FormTrendAnalytics | null
  }>({ formId, themes: null, trend: null })
  const freshThemes = themesResult.isPlaceholderData ? undefined : themesResult.data
  const freshTrend = trendResult.isPlaceholderData ? undefined : trendResult.data
  if (
    lastGood.formId !== formId ||
    (freshThemes && freshThemes !== lastGood.themes) ||
    (freshTrend && freshTrend !== lastGood.trend)
  ) {
    const sameForm = lastGood.formId === formId
    setLastGood({
      formId,
      themes: freshThemes ?? (sameForm ? lastGood.themes : null),
      trend: freshTrend ?? (sameForm ? lastGood.trend : null),
    })
  }
  const sameFormLastGood = lastGood.formId === formId ? lastGood : null
  const themes = themesResult.data ?? sameFormLastGood?.themes ?? null
  const trend = trendResult.data ?? sameFormLastGood?.trend ?? null
  const themesPending = themesResult.isPlaceholderData
  const trendPending = trendResult.isPlaceholderData
  const trendPagePending = trendPending && trendChangeScope === 'page'
  const topicChartPending = trendPending && trendChangeScope === 'topic-chart'

  // Keep an explicit selection in sync with what the server actually charted (it
  // drops ids with no mentions in the window, caps at the max) so the picker count
  // + swatch colours stay aligned with the chart.
  if (freshTrend && topicSel) {
    const charted = freshTrend.topicVolumeSeries.map((series) => series.id)
    if (charted.length !== topicSel.length || charted.some((id, i) => id !== topicSel[i])) {
      setTopicSel(charted)
    }
  }

  const loadFailure = !hasValidId
    ? "This form hasn't been saved yet, so there's no dashboard."
    : formResult.error ??
      responsesResult.error ??
      (themesResult.isError && !themes ? themesResult.error : null)
  const loadError =
    typeof loadFailure === 'string'
      ? loadFailure
      : loadFailure instanceof ApiError
        ? loadFailure.message
        : 'Could not load this dashboard.'

  // Only an error replaces the page. While loading, the static chrome (tabs,
  // headings, card labels, filter controls) renders right away and each
  // data-backed slot shows its own placeholder until its fetch lands.
  if (loadFailure) {
    return (
      <div>
        <FormDetailTabs
          hasDashboardData={hasValidId}
          onToggleSidebar={onToggleSidebar}
          showSidebarToggle={showSidebarToggle}
        />
        <div className="flex min-h-100 flex-col items-center justify-center gap-4 px-14 py-16 text-center">
          <p className="m-0 text-[14px] text-[#726f6f]">{loadError}</p>
          <Link
            className="rounded-[5px] border border-[#d7dbe6] bg-white px-3 py-1.5 text-[13px] font-medium text-[#3f4045] no-underline transition-colors hover:bg-[#f7f8fb]"
            to="/"
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  // The status row + Response tab need both; themes/trend each fill in on their own.
  const formReady = form !== null && responses !== null
  const trendReady = trend !== null && themes !== null

  const selectedTopic =
    activeView === 'themes' && themes
      ? ([...themes.highIntenseTopics, ...themes.aiDiscoveredTopics].find(
          (topic) => topic.id === selectedTopicId,
        ) ?? null)
      : null

  const sentimentTotal = themes
    ? themes.sentiment.negative + themes.sentiment.neutral + themes.sentiment.positive
    : 0

  const activeDemoCount = Object.values(demoSel).reduce((sum, values) => sum + values.length, 0)
  const demoFilterControl =
    themes && themes.demographicFilters.length > 0 ? (
      <FeedbackFilter
        activeFilterCount={activeDemoCount}
        demographicFilters={themes.demographicFilters}
        onClear={clearDemo}
        onToggleDemo={toggleDemo}
        variant="labeled"
        selectedDemos={Object.fromEntries(
          Object.entries(demoSel).map(([label, values]) => [label, new Set(values)]),
        )}
      />
    ) : null

  // The chosen demographic answers as removable chips, on a line under the filter
  // row (the date range shows itself on its own button, with its own ✕).
  const activeFilterChips: ActiveFilterChip[] = Object.entries(demoSel).flatMap(
    ([label, values]) =>
      values.map((value) => ({
        id: `demo:${label}:${value}`,
        group: label,
        value,
        onRemove: () => toggleDemo(label, value),
      })),
  )
  const activeFilterBar = (
    <ActiveFilterBar
      chips={activeFilterChips}
      // Pulled up under the filter row it belongs to (the column's gap is 20px).
      className="-mt-2"
      onClearAll={() => {
        resetRange()
        clearDemo()
      }}
    />
  )

  return (
    <div>
      <FormDetailTabs
        hasDashboardData
        onToggleSidebar={onToggleSidebar}
        showSidebarToggle={showSidebarToggle}
      />

      <div className="flex flex-col gap-5 px-10 pt-5 pb-16 max-[900px]:px-6 max-[560px]:px-4">
        <DashboardViewTabs activeView={activeView} onSelectView={setActiveView} />

        <div
          className="w-full"
          style={
            selectedTopic && detailPanelWidth !== null
              ? { paddingRight: detailPanelWidth }
              : undefined
          }
        >
          <div
            className={cn(
              'mx-auto flex w-full flex-col gap-5',
              activeView === 'trend' ? 'max-w-366.5' : 'min-w-150 max-w-182',
            )}
          >
            <div className="flex flex-col gap-1.25">
              <StatusRow form={formReady ? form : null} now={now} />
              <div className="flex items-start justify-between gap-2.5 py-2.5">
                <div className="flex items-center gap-2.5">
                  {activeView === 'themes' ? (
                    <Tag className="shrink-0 text-[#1e55c5]" size={24} />
                  ) : (
                    <TrendingUp className="shrink-0 text-[#1e55c5]" size={24} />
                  )}
                  {activeView === 'themes' && !themes ? (
                    <Skeleton className="h-6 w-56" />
                  ) : (
                    <h1 className="m-0 text-[20px] font-semibold tracking-[0.2px] text-black">
                      {activeView === 'themes'
                        ? themes?.title
                        : activeView === 'trend'
                          ? 'Trend Overview'
                          : 'Response Overview'}
                    </h1>
                  )}
                </div>
              </div>
            </div>

            {activeView === 'themes' ? (
              !themes ? (
                <ContentSkeleton label="Loading themes…" />
              ) : themes.aiDiscoveredTopics.length === 0 ? (
                <>
                  {themes.totalMentions > 0 ? (
                    <div className="flex flex-wrap items-end gap-3">
                      <DateRangeFilter
                        isDefault={range === null}
                        label={range === null ? themes.rangeLabel : undefined}
                        onChange={changeRange}
                        onReset={resetRange}
                        value={range ?? { from: themes.from, to: themes.to }}
                      />
                      {demoFilterControl}
                      {themesPending ? (
                        <UpdatingIndicator />
                      ) : null}
                    </div>
                  ) : null}
                  {themes.totalMentions > 0 ? activeFilterBar : null}
                  <EmptyNote>
                    {themes.totalMentions === 0
                      ? 'No themes yet. The AI pipeline hasn’t analysed this form’s feedback into topics.'
                      : `This form has analysed feedback, but none falls in ${themes.rangeLabel}${activeDemoCount > 0 ? ' for the selected demographics' : ''}. Try “All feedback”, a wider date range${activeDemoCount > 0 ? ' or fewer demographic filters' : ''}.`}
                  </EmptyNote>
                </>
              ) : (
                <>
                  <div className="flex flex-wrap items-end gap-3">
                    <DateRangeFilter
                      isDefault={range === null}
                      label={range === null ? themes.rangeLabel : undefined}
                      onChange={changeRange}
                      onReset={resetRange}
                      value={range ?? { from: themes.from, to: themes.to }}
                    />
                    {demoFilterControl}
                    {themesPending ? (
                      <UpdatingIndicator />
                    ) : null}
                  </div>
                  {activeFilterBar}
                  <div className="flex flex-wrap items-center gap-4">
                    <StatCard
                      deltaClassName="text-[#0b842d]"
                      deltaLabel={
                        themes.responderDelta > 0 ? themes.responderDeltaLabel : undefined
                      }
                      icon={<Users className="text-[#1e55c5]" size={31} strokeWidth={1.8} />}
                      iconBgClassName="bg-[#edf2fd]"
                      label="Total Responder"
                      value={themes.totalResponders}
                    />

                    <div className="flex h-29.5 w-56 shrink-0 flex-col justify-center rounded-[10px] border border-[#e9eaed] bg-white px-3.75">
                      <p className="m-0 text-[12px] font-medium text-[#929292]">
                        Overall Sentiment
                      </p>
                      <div className="flex items-center gap-3">
                        <SentimentGauge
                          negative={themes.sentiment.negative}
                          neutral={themes.sentiment.neutral}
                          outOf={themes.sentiment.outOf}
                          positive={themes.sentiment.positive}
                          score={themes.sentiment.score}
                          width={80}
                        />
                        <div className="flex flex-col gap-2 text-[12px]">
                          <span className="flex items-center gap-2">
                            <span className="size-1.75 shrink-0 rounded-full bg-[rgba(236,102,131,0.8)]" />
                            <span className="text-[#929292]">
                              Negative: <span className="text-[#14181f]">{percentOf(themes.sentiment.negative, sentimentTotal)}%</span>
                            </span>
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="size-1.75 shrink-0 rounded-full bg-[rgba(253,210,118,0.8)]" />
                            <span className="text-[#929292]">
                              Neutral: <span className="text-[#14181f]">{percentOf(themes.sentiment.neutral, sentimentTotal)}%</span>
                            </span>
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="size-1.75 shrink-0 rounded-full bg-[rgba(156,221,153,0.8)]" />
                            <span className="text-[#929292]">
                              Positive: <span className="text-[#14181f]">{percentOf(themes.sentiment.positive, sentimentTotal)}%</span>
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <StatCard
                      deltaClassName="text-[#881921]"
                      deltaLabel={
                        themes.highIntenseTopics.length > 0 ? 'needs attention' : undefined
                      }
                      icon={<TriangleAlert className="text-[#e0507a]" size={28} strokeWidth={1.8} />}
                      iconBgClassName="bg-[#ffeaeb]"
                      label="High Intense Topic"
                      value={themes.highIntenseTopics.length}
                    />
                  </div>

                  {themes.highIntenseTopics.length > 0 ? (
                    <TopicSentimentCard
                      onSelectTopic={setSelectedTopicId}
                      selectedTopicId={selectedTopicId}
                      title="High Intense Topic"
                      topics={themes.highIntenseTopics}
                    />
                  ) : null}

                  <TopicSentimentCard
                    onSelectTopic={setSelectedTopicId}
                    pageSize={8}
                    selectedTopicId={selectedTopicId}
                    sortable
                    title={`AI discovered topic (${themes.aiDiscoveredTopics.length})`}
                    topics={themes.aiDiscoveredTopics}
                  />
                </>
              )
            ) : null}

            {activeView === 'response' ? (
              !formReady ? (
                <ContentSkeleton label="Loading responses…" />
              ) : (
                <>
                  <div className="flex h-27 w-full shrink-0 items-center gap-4.5 rounded-[10px] border border-[#e9eaed] bg-white px-3.75 pt-5.5 pb-6.25">
                    <div className="flex size-15.25 shrink-0 items-center justify-center rounded-[6px] bg-[#edf2fd]">
                      <Users className="text-[#1e55c5]" size={31} strokeWidth={1.8} />
                    </div>
                    <div className="flex flex-col gap-2.5">
                      <p className="m-0 text-[12px] font-medium text-[#929292]">Total Response</p>
                      <p className="m-0 text-[20px] font-bold text-[#14181f]">
                        {responses.totalResponses}
                      </p>
                    </div>
                  </div>

                  {responses.totalResponses === 0 ? (
                    <div className="flex min-h-40 items-center justify-center rounded-[15px] border border-dashed border-[#d2d8e5] bg-white px-6 py-10 text-center">
                      <p className="m-0 text-[14px] text-[#726f6f]">
                        No responses have been submitted yet.
                      </p>
                    </div>
                  ) : (
                    <>
                      <ResponseOverviewSection
                        breakdowns={responses.demographic}
                        title="Demographic Overview"
                      />
                      <ResponseOverviewSection
                        breakdowns={responses.feedback}
                        title="Feedback Overview"
                      />
                    </>
                  )}
                </>
              )
            ) : null}

            {activeView === 'trend' && !trendReady ? (
              <ContentSkeleton label="Loading trend…" />
            ) : null}

            {/* Same rule as Themes: no filters when the form has no analysed feedback at
                all (`totalMentions` is all-time) — there's nothing to filter. They stay when
                data exists but the current range/filters exclude it, so you can widen them. */}
            {activeView === 'trend' && trendReady && trend.totalMentions > 0 ? (
              <div className="flex flex-wrap items-end gap-3">
                <DateRangeFilter
                  isDefault={range === null}
                  label={range === null ? trend.rangeLabel : undefined}
                  onChange={changeRange}
                  onReset={resetRange}
                  value={range ?? { from: trend.from, to: trend.to }}
                />
                {demoFilterControl}
                <div className="flex flex-col items-start gap-2">
                  <span className="text-[9.5px] font-medium text-black">Summarise by:</span>
                  <div className="inline-flex overflow-hidden rounded-[10px] border border-[#1e55c5]">
                    {BUCKETS.map((option) => (
                      <button
                        className={cn(
                          'h-11.25 cursor-pointer px-3 text-[12px] font-semibold whitespace-nowrap transition-colors',
                          option.value === bucket
                            ? 'bg-[#1e55c5] text-white'
                            : 'bg-white text-[#1e55c5] hover:bg-[#f7f8fb]',
                        )}
                        key={option.value}
                        onClick={() => changeBucket(option.value)}
                        type="button"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                {trendPagePending ? <UpdatingIndicator /> : null}
              </div>
            ) : null}
            {activeView === 'trend' && trendReady && trend.totalMentions > 0 ? activeFilterBar : null}

            {activeView === 'trend' && trendReady ? (
              trend.topicVolumeSeries.length > 0 ? (
                <TrendView
                  topicControl={
                    trend.availableTopics.length > 0 ? (
                      <>
                        {topicChartPending ? (
                          <span
                            aria-live="polite"
                            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#726f6f]"
                            role="status"
                          >
                            <RefreshCw className="animate-spin" size={14} />
                            Updating…
                          </span>
                        ) : null}
                        <TopicPicker
                          max={TREND_SERIES_MAX}
                          onRankChange={changeRank}
                          onReset={resetTopicSel}
                          onSelectionChange={changeTopicSel}
                          pending={topicChartPending}
                          rank={rank}
                          selectedIds={topicSel ?? trend.topicVolumeSeries.map((s) => s.id)}
                          topics={trend.availableTopics}
                          variant="compact"
                        />
                      </>
                    ) : null
                  }
                  trend={trend}
                />
              ) : trend.totalMentions === 0 ? (
                <EmptyNote>
                  No feedback has been analysed for this form yet. The AI pipeline runs once
                  responses start coming in.
                </EmptyNote>
              ) : (
                <EmptyNote>
                  This form has analysed feedback, but none falls in {trend.rangeLabel}
                  {activeDemoCount > 0 ? ' for the selected demographics' : ''}. Try a wider date
                  range{activeDemoCount > 0 ? ' or fewer demographic filters' : ''}.
                </EmptyNote>
              )
            ) : null}
          </div>
        </div>
      </div>

      {selectedTopic && themes ? (
        <TopicDetailPanel
          demographicFilters={themes.demographicFilters}
          key={selectedTopic.id}
          mainDemoSelection={demoSel}
          onClose={() => setSelectedTopicId(null)}
          topic={selectedTopic}
          width={detailPanelWidth}
        />
      ) : null}
    </div>
  )
}
