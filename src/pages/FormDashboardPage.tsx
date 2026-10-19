import {
  ArrowUp,
  BarChart3,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  MessageSquareText,
  Printer,
  RefreshCw,
  Sparkles,
  Tag,
  TrendingUp,
  TriangleAlert,
  UserRound,
  Users,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useState } from 'react'

import { downloadFormResponses, downloadFormThemes, type FormThemeAnalytics } from '../api/analytics'
import type { ApiFormDetail } from '../api/forms'
import { formQuery, individualQuery, responsesQuery, themesQuery, trendQuery } from '../api/queries'
import { FormLoadError } from '../components/FormLoadError'
import { PrintPortal } from '../components/report/PrintPortal'
import { ThemesReport } from '../components/report/ThemesReport'
import { ActiveFilterBar, type ActiveFilterChip } from '../components/dashboard/ActiveFilterBar'
import { DateRangeFilter } from '../components/dashboard/DateRangeFilter'
import { ExportMenu } from '../components/dashboard/ExportMenu'
import { FeedbackFilter } from '../components/dashboard/FeedbackFilter'
import { IndividualResponseList } from '../components/dashboard/IndividualResponseList'
import { ResponseDetailPanel } from '../components/dashboard/ResponseDetailPanel'
import { ResponseOverviewSection } from '../components/dashboard/ResponseOverviewSection'
import { responseLabels } from '../components/dashboard/responseLabel'
import { searchResponses } from '../components/dashboard/responseSearch'
import { SentimentGauge } from '../components/dashboard/SentimentGauge'
import { percentOf } from '../components/dashboard/sentimentScore'
import { TopicDetailPanel } from '../components/dashboard/TopicDetailPanel'
import { TopicPicker } from '../components/dashboard/TopicPicker'
import { TopicSentimentCard } from '../components/dashboard/TopicSentimentCard'
import type { TopicSortOption } from '../components/dashboard/topicSort'
import { computeAxisMax } from '../components/dashboard/topicAxis'
import { TrendView } from '../components/dashboard/TrendView'
import { TREND_SERIES_MAX } from '../components/dashboard/trendColors'
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip'
import { useHideNames } from '../hooks/useHideNames'
import { useRouteForm } from '../hooks/useRouteForm'
import { useRecordFormOpen } from '../hooks/useRecordFormOpen'
import type { DashboardView } from '../components/navigation/DashboardViewTabs'
import { DashboardViewTabs } from '../components/navigation/DashboardViewTabs'
import { FolderBreadcrumbBar } from '../components/navigation/FolderBreadcrumb'
import { FormActionButton } from '../components/navigation/FormActionBar'
import { FormDetailTabs } from '../components/navigation/FormDetailTabs'
import { ResponseStateChip } from '../components/navigation/ResponseStateChip'
import type { FormTrendAnalytics, TrendBucket, TrendRank } from '../data/dashboardAnalytics'
import { useDetailPanelLayout } from '../hooks/useDetailPanelLayout'
import { useNow } from '../hooks/useNow'
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
/** How fresh the tab's data is: the newest response, or the last AI run. null while loading. */
type Freshness = { kind: 'response' | 'ai'; at: string | null | undefined; pending?: number } | null

function StatusRow({ form, now, freshness }: { form: ApiFormDetail | null; now: number; freshness: Freshness }) {
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
      <span className="inline-flex items-center gap-1.5 text-[12px] whitespace-nowrap">
        {freshness?.kind === 'ai' ? (
          <Sparkles className="text-[#3f4045]" size={20} strokeWidth={1.8} />
        ) : (
          <MessageSquareText className="text-[#3f4045]" size={20} strokeWidth={1.8} />
        )}
        <span className="font-medium text-[#929292]">
          {freshness?.kind === 'ai' ? 'AI analysed' : 'Last response'}
        </span>
        {freshness ? (
          <span className="font-bold text-[#14181f]">
            {freshness.at
              ? formatDateTime(freshness.at)
              : '—'}
            {freshness.pending ? (
              <span className="font-medium text-[#929292]"> · {freshness.pending} pending</span>
            ) : null}
          </span>
        ) : (
          <Skeleton className="h-3.5 w-16" />
        )}
      </span>
    </div>
  )
}

const TOPIC_LIST_ID = 'topic-list'

function StatCard({
  icon,
  iconBgClassName,
  label,
  value,
  deltaLabel,
  deltaClassName,
  onClick,
  actionLabel,
  note,
  noteTooltip,
}: {
  icon: React.ReactNode
  iconBgClassName: string
  label: string
  value: number | string
  /** Omit to hide the delta line entirely. */
  deltaLabel?: string
  deltaClassName: string
  /** Makes the whole card a button (e.g. jump to the list behind the number). */
  onClick?: () => void
  /** Accessible name for the button, when `onClick` is set. */
  actionLabel?: string
  /** A grey aside beside the big number. */
  note?: string
  /** Explains `note` on hover. */
  noteTooltip?: string
}) {
  const Root = onClick ? 'button' : 'div'
  return (
    <Root
      aria-label={onClick && actionLabel ? `${actionLabel} (${value})` : undefined}
      className={cn(
        'flex h-29.5 min-w-0 items-center gap-4.5 rounded-[10px] border border-[#e9eaed] bg-white px-3.75 pt-5.5 pb-6.25 text-left',
        onClick && 'cursor-pointer transition-colors hover:border-[#d2d8e5] hover:bg-[#fbfcfe]',
      )}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      <div
        className={`flex size-15.25 shrink-0 items-center justify-center rounded-[6px] ${iconBgClassName}`}
      >
        {icon}
      </div>
      <div className="flex min-w-0 flex-col gap-2.5">
        <p className="m-0 truncate text-[12px] font-medium text-[#929292]">{label}</p>
        <p className="m-0 flex min-w-0 items-baseline gap-2">
          <span className="text-[20px] font-bold text-[#14181f]">{value}</span>
          {note ? (
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <span className="cursor-help truncate text-[12px] font-medium text-[#929292] underline decoration-dotted underline-offset-2">
                  {note}
                </span>
              </TooltipTrigger>
              {noteTooltip ? (
                <TooltipContent className="max-w-64 whitespace-normal leading-4.5" side="top">
                  {noteTooltip}
                </TooltipContent>
              ) : null}
            </Tooltip>
          ) : null}
        </p>
        {/* Always one line tall, even when empty or wrapping: a second line spills into
            the card's bottom padding, so the big number never moves (and lines up across cards). */}
        <div className={`flex h-4 min-w-0 items-start gap-0.5 text-[12px] leading-4 font-medium ${deltaClassName}`}>
          {deltaLabel ? (
            <>
              <ArrowUp className="shrink-0" size={15} />
              <span className="whitespace-nowrap">{deltaLabel}</span>
            </>
          ) : null}
        </div>
      </div>
    </Root>
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

export type FormDashboardPageProps = {
  /** Folders containing this form, outermost first (empty: at the root of My Project). */
  folderPath?: { id: string; label: string }[]
  showSidebarToggle?: boolean
  onToggleSidebar?: () => void
}

export function FormDashboardPage({
  folderPath = [],
  showSidebarToggle = false,
  onToggleSidebar,
}: FormDashboardPageProps) {
  // The URL carries the form's urlId; the API calls use its numeric id.
  const routeForm = useRouteForm()
  const formId = routeForm.formId ?? 0
  const hasValidId = routeForm.formId !== null
  useRecordFormOpen(routeForm.formId)

  const [activeView, setActiveView] = useState<DashboardView>('themes')
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const [selectedResponseId, setSelectedResponseId] = useState<number | null>(null)
  const [responseQuery, setResponseQuery] = useState('')
  const [topicQuery, setTopicQuery] = useState('')
  // Held here, not in the topic card, so the exports list topics in the same order.
  const [topicSort, setTopicSort] = useState<TopicSortOption>('priority')
  // The Themes PDF report, while its print dialog is open.
  const [printingReport, setPrintingReport] = useState(false)
  const finishPrinting = useCallback(() => setPrintingReport(false), [])
  const detailPanelLayout = useDetailPanelLayout()
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
  const { hideNames, toggleHideNames } = useHideNames()
  // Pinned line on the Trend tab's Topic Trends card (see TrendView).
  const [trendPinned, setTrendPinned] = useState<string | null>(null)
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
  // Every answer of every response — only fetched once the Individual tab is opened.
  const individualResult = useQuery({
    ...individualQuery(formId),
    enabled: hasValidId && activeView === 'individual',
  })
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
  const individual = individualResult.data ?? null

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

  const loadFailure =
    routeForm.status === 'error'
      ? (routeForm.error ?? "This form hasn't been saved yet, so there's no dashboard.")
      : !hasValidId
        ? null // still resolving the URL — the page shows its loading placeholders
        : (formResult.error ??
          responsesResult.error ??
          (themesResult.isError && !themes ? themesResult.error : null))
  function retryLoad() {
    if (routeForm.status === 'error') return routeForm.retry()
    if (formResult.isError) void formResult.refetch()
    if (responsesResult.isError) void responsesResult.refetch()
    if (themesResult.isError) void themesResult.refetch()
  }

  // Only an error replaces the page. While loading, the static chrome (tabs,
  // headings, card labels, filter controls) renders right away and each
  // data-backed slot shows its own placeholder until its fetch lands.
  if (loadFailure) {
    return (
      <div>
        <FormDetailTabs
          canEdit={routeForm.role === 'owner'}
          hasDashboardData={hasValidId}
          onToggleSidebar={onToggleSidebar}
          showSidebarToggle={showSidebarToggle}
        />
        <div className="flex min-h-100 items-center justify-center px-4 py-16">
          <FormLoadError
            error={loadFailure}
            fallbackMessage={
              typeof loadFailure === 'string' ? loadFailure : 'Could not load this dashboard.'
            }
            onRetry={retryLoad}
          />
        </div>
      </div>
    )
  }

  // The status row + Response tab need both; themes/trend each fill in on their own.
  const formReady = form !== null && responses !== null
  const trendReady = trend !== null && themes !== null

  // Themes panel → Trend tab, with that topic charted and pinned. Range + demographics
  // are shared already. The panel's selection is kept, so going back to Themes reopens it.
  const compareInTrend = (topicId: string) => {
    const charted = topicSel ?? trend?.topicVolumeSeries.map((s) => s.id) ?? []
    if (!charted.includes(topicId)) {
      // Chart full: it replaces the last (lowest-ranked) line.
      changeTopicSel([...charted.slice(0, TREND_SERIES_MAX - 1), topicId])
    }
    setTrendPinned(topicId)
    setActiveView('trend')
    window.scrollTo({ top: 0 })
  }

  // Themes panel → Individual tab with that response open. The topic stays selected,
  // so going back to Themes reopens it.
  const openResponse = (submissionId: number) => {
    setSelectedResponseId(submissionId)
    setActiveView('individual')
    window.scrollTo({ top: 0 })
  }

  // "Hide names" only makes sense when this form recorded some, on a tab that shows them.
  const hasNames =
    (activeView === 'themes' &&
      !!themes &&
      [...themes.violationTopics, ...themes.aiDiscoveredTopics].some((topic) =>
        topic.feedbackSegment.some((point) => point.respondentName),
      )) ||
    (activeView === 'response' &&
      !!responses &&
      [...responses.demographic, ...responses.feedback].some(
        (breakdown) =>
          breakdown.kind === 'text' &&
          breakdown.responses.some((response) => typeof response !== 'string' && response.respondentName),
      )) ||
    (activeView === 'individual' &&
      !!individual &&
      individual.responses.some((response) => response.respondentName))

  // Found on every tab: the panel stays mounted (just hidden) off Themes, so coming
  // back finds it as it was — expanded feedback, filters, scroll.
  const openTopic = themes
    ? ([...themes.violationTopics, ...themes.aiDiscoveredTopics].find(
        (topic) => topic.id === selectedTopicId,
      ) ?? null)
    : null
  const selectedTopic = activeView === 'themes' ? openTopic : null

  const selectedResponse =
    activeView === 'individual'
      ? (individual?.responses.find((response) => response.id === selectedResponseId) ?? null)
      : null
  const individualLabels = individual ? responseLabels(individual.responses, hideNames) : new Map<number, string>()
  // The panel's Previous / Next step through the search results, not every response.
  const responseResults = individual ? searchResponses(individual.responses, individualLabels, responseQuery) : []
  const selectedResultIndex = responseResults.findIndex((result) => result.response.id === selectedResponseId)
  const stepResponse = (offset: number) => {
    const next = responseResults[selectedResultIndex + offset]
    if (next) setSelectedResponseId(next.response.id)
  }

    const topicAxisMax = themes ? computeAxisMax(themes.aiDiscoveredTopics) : undefined
  const showViolationTopics = () => {
    document.getElementById(TOPIC_LIST_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const sentimentTotal = themes
    ? themes.sentiment.negative + themes.sentiment.neutral + themes.sentiment.positive
    : 0

  // Shown whether or not the feedback has been analysed yet, so the responder count
  // is always visible. Three equal columns; wraps once one would drop under 14rem.
  const themesStatCards = themes ? (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] gap-4">
      <StatCard
        deltaClassName="text-[#0b842d]"
        deltaLabel={themes.responderDelta > 0 ? themes.responderDeltaLabel : undefined}
        icon={<Users className="text-[#1e55c5]" size={31} strokeWidth={1.8} />}
        iconBgClassName="bg-[#edf2fd]"
        label="Total Responses"
        note={themes.awaitingAnalysis ? `${themes.awaitingAnalysis} pending analysis` : undefined}
        noteTooltip="AI analysis runs automatically. These responses are counted here, but their feedback won't appear in topics or sentiment until they're analysed."
        value={themes.totalResponders}
      />

      <div className="flex h-29.5 min-w-0 flex-col justify-center rounded-[10px] border border-[#e9eaed] bg-white px-3.75">
        <p className="m-0 text-[12px] font-medium text-[#929292]">Overall Sentiment</p>
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
              <span className={cn('size-1.75 shrink-0 rounded-full', sentimentTotal === 0 ? 'bg-[#d2d8e5]' : 'bg-[rgba(236,102,131,0.8)]')} />
              <span className="text-[#929292]">
                Negative: <span className={sentimentTotal === 0 ? 'text-[#b0b1b3]' : 'text-[#14181f]'}>{percentOf(themes.sentiment.negative, sentimentTotal)}%</span>
              </span>
            </span>
            <span className="flex items-center gap-2">
              <span className={cn('size-1.75 shrink-0 rounded-full', sentimentTotal === 0 ? 'bg-[#d2d8e5]' : 'bg-[rgba(253,210,118,0.8)]')} />
              <span className="text-[#929292]">
                Neutral: <span className={sentimentTotal === 0 ? 'text-[#b0b1b3]' : 'text-[#14181f]'}>{percentOf(themes.sentiment.neutral, sentimentTotal)}%</span>
              </span>
            </span>
            <span className="flex items-center gap-2">
              <span className={cn('size-1.75 shrink-0 rounded-full', sentimentTotal === 0 ? 'bg-[#d2d8e5]' : 'bg-[rgba(156,221,153,0.8)]')} />
              <span className="text-[#929292]">
                Positive: <span className={sentimentTotal === 0 ? 'text-[#b0b1b3]' : 'text-[#14181f]'}>{percentOf(themes.sentiment.positive, sentimentTotal)}%</span>
              </span>
            </span>
          </div>
        </div>
      </div>

      <StatCard
        deltaClassName="text-[#881921]"
        icon={<TriangleAlert className="text-[#e0507a]" size={28} strokeWidth={1.8} />}
        iconBgClassName="bg-[#ffeaeb]"
        label="Violation Topics"
        value={themes.violationTopics.length}
        {...(themes.violationTopics.length > 0
          ? { onClick: showViolationTopics, actionLabel: 'Show violation topics' }
          : {})}
      />
    </div>
  ) : null

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
  // The filters the Themes numbers (and their exports) are limited to; empty = all feedback.
  const themesScope =
    themes && (range !== null || activeDemoCount > 0)
      ? [
          themes.rangeLabel,
          ...Object.entries(demoSel)
            .filter(([, values]) => values.length > 0)
            .map(([label, values]) => `${label} = ${values.join(', ')}`),
        ]
      : []
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
        canEdit={routeForm.role === 'owner'}
        hasDashboardData
        onToggleSidebar={onToggleSidebar}
        showSidebarToggle={showSidebarToggle}
      />
      <FolderBreadcrumbBar
        reserveRight={
          (selectedTopic || selectedResponse) && detailPanelLayout.mode === 'docked'
            ? detailPanelLayout.width
            : undefined
        }
        actions={
          <>
            {/* Styled like the editor's action buttons; pressed = names shown, off while screen-sharing. */}
            {hasNames ? (
              <FormActionButton
                aria-pressed={!hideNames}
                className={
                  hideNames
                    ? 'border border-[#d2d8e5] bg-white text-[#726f6f] hover:bg-[#f7f8fb]'
                    : 'border border-[#1e55c5] bg-[#eef3ff] text-[#1e55c5] hover:bg-[#e3ebfd]'
                }
                icon={hideNames ? <EyeOff size={18} strokeWidth={2.2} /> : <Eye size={18} strokeWidth={2.2} />}
                onClick={toggleHideNames}
              >
                Show names
              </FormActionButton>
            ) : null}
            {activeView === 'response' && formReady && responses.totalResponses > 0 ? (
              <ExportMenu
                formTitle={form.formTitle}
                includeNames={!hasNames || !hideNames}
                options={[
                  {
                    label: 'Excel (.xlsx)',
                    icon: FileSpreadsheet,
                    extension: 'xlsx',
                    download: () => downloadFormResponses(formId, 'xlsx', !hideNames),
                  },
                  {
                    label: 'CSV (.csv)',
                    icon: FileText,
                    extension: 'csv',
                    download: () => downloadFormResponses(formId, 'csv', !hideNames),
                  },
                ]}
                what="responses"
              />
            ) : null}
            {/* Exports what's on screen: the same date range and demographic filter. */}
            {activeView === 'themes' && form && themes && themes.totalMentions > 0 ? (
              <ExportMenu
                formTitle={form.formTitle}
                includeNames={!hasNames || !hideNames}
                options={[
                  {
                    label: 'Excel (.xlsx)',
                    icon: FileSpreadsheet,
                    extension: 'xlsx',
                    download: () =>
                      downloadFormThemes(
                        formId,
                        { from: range?.from, to: range?.to, demo: demoSel },
                        topicSort,
                        !hideNames,
                      ),
                  },
                  { label: 'PDF report', icon: Printer, run: () => setPrintingReport(true) },
                ]}
                scope={themesScope}
                what="AI analysis"
              />
            ) : null}
          </>
        }
        // The form's name heads every tab, so a screenshot or screen-share shows which form it is.
        heading={
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {form ? (
              <h1 className="m-0 text-[24px] leading-8 font-bold wrap-break-word text-black">
                {form.formTitle?.trim() || 'Untitled form'}
              </h1>
            ) : (
              <Skeleton className="h-8 w-72" />
            )}
            <StatusRow
              form={form}
              // Response / Individual show raw responses; Themes / Trend wait on the AI.
              freshness={
                activeView === 'themes' || activeView === 'trend'
                  ? themes
                    ? { kind: 'ai', at: themes.lastAnalysedAt, pending: themes.awaitingAnalysis }
                    : null
                  : responses
                    ? { kind: 'response', at: responses.lastResponseAt }
                    : null
              }
              now={now}
            />
          </div>
        }
        path={folderPath}
      />

      <div className="flex flex-col gap-3 px-10 pb-16 max-[900px]:px-6 max-[560px]:px-4">
        <DashboardViewTabs activeView={activeView} onSelectView={setActiveView} />

        <div
          className="w-full"
          style={
            (selectedTopic || selectedResponse) && detailPanelLayout.mode === 'docked'
              ? { paddingRight: detailPanelLayout.width }
              : undefined
          }
        >
          <div
            className={cn(
              'mx-auto flex w-full flex-col gap-5',
              // Every tab is the same width, so switching doesn't shift the page. A docked
              // detail panel shrinks the content (down to min-w-150, which
              // useDetailPanelLayout assumes; Trend has no panel).
              'max-w-366.5',
              activeView !== 'trend' && 'min-w-150',
            )}
          >
            <div className="-mb-2 flex flex-col gap-1.25">
              <div className="flex min-h-11.25 items-center justify-between gap-2.5 pt-2.5">
                <div className="flex items-center gap-2.5">
                  {activeView === 'themes' ? (
                    <Tag className="shrink-0 text-[#1e55c5]" size={24} />
                  ) : activeView === 'individual' ? (
                    <UserRound className="shrink-0 text-[#1e55c5]" size={24} />
                  ) : activeView === 'trend' ? (
                    <TrendingUp className="shrink-0 text-[#1e55c5]" size={24} />
                  ) : (
                    <BarChart3 className="shrink-0 text-[#1e55c5]" size={24} />
                  )}
                  <h2 className="m-0 text-[20px] font-semibold tracking-[0.2px] text-black">
                    {activeView === 'themes'
                      ? 'Themes Overview'
                      : activeView === 'trend'
                        ? 'Trend Overview'
                        : activeView === 'individual'
                          ? 'Individual Responses'
                          : 'Response Overview'}
                  </h2>
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
                  {themesStatCards}
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
                  {themesStatCards}

                  <TopicSentimentCard
                    axisMax={topicAxisMax}
                    id={TOPIC_LIST_ID}
                    onQueryChange={setTopicQuery}
                    onSortChange={setTopicSort}
                    onSelectTopic={setSelectedTopicId}
                    pageSize={15}
                    query={topicQuery}
                    sort={topicSort}
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
                      <p className="m-0 text-[12px] font-medium text-[#929292]">Total Responses</p>
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
                        hideNames={hideNames}
                        title="Demographic Overview"
                      />
                      <ResponseOverviewSection
                        breakdowns={responses.feedback}
                        hideNames={hideNames}
                        title="Feedback Overview"
                      />
                    </>
                  )}
                </>
              )
            ) : null}

            {activeView === 'individual' ? (
              individualResult.isError ? (
                <FormLoadError
                  error={individualResult.error}
                  fallbackMessage="Could not load the responses."
                  onRetry={() => void individualResult.refetch()}
                />
              ) : !individual ? (
                <ContentSkeleton label="Loading responses…" />
              ) : individual.responses.length === 0 ? (
                <EmptyNote>No responses have been submitted yet.</EmptyNote>
              ) : (
                <IndividualResponseList
                  labels={individualLabels}
                  onQueryChange={setResponseQuery}
                  onSelect={setSelectedResponseId}
                  query={responseQuery}
                  results={responseResults}
                  selectedId={selectedResponse?.id ?? null}
                  total={individual.responses.length}
                />
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
                  onPinnedChange={setTrendPinned}
                  pinned={trendPinned}
                  trend={trend}
                />
              ) : trend.totalMentions === 0 ? (
                <EmptyNote>
                  No feedback has been analysed for this form yet. The AI pipeline runs once
                  responses start coming in.
                </EmptyNote>
              ) : themes.aiDiscoveredTopics.length > 0 ? (
                // Feedback is in range, but none of it has a topic yet (only uncategorised).
                <EmptyNote>
                  Not enough feedback to group into topics yet, so there are no trends to chart.
                  The AI starts grouping once more responses come in. You can still read this
                  feedback on the Themes tab.
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

      {openTopic && themes ? (
        <TopicDetailPanel
          demographicFilters={themes.demographicFilters}
          hidden={activeView !== 'themes'}
          initialQuery={topicQuery}
          key={openTopic.id}
          mainDemoSelection={demoSel}
          onClose={() => setSelectedTopicId(null)}
          hideNames={hideNames}
          onCompareInTrend={() => compareInTrend(openTopic.id)}
          onOpenResponse={openResponse}
          topic={openTopic}
          layout={detailPanelLayout}
        />
      ) : null}

      {printingReport && form && themes ? (
        <PrintPortal onDone={finishPrinting} title={`${form.formTitle?.trim() || 'Form'} - AI analysis`}>
          <ThemesReport
            formTitle={form.formTitle?.trim() || 'Untitled form'}
            scope={themesScope}
            sort={topicSort}
            themes={themes}
          />
        </PrintPortal>
      ) : null}

      {selectedResponse && individual ? (
        <ResponseDetailPanel
          fields={individual.fields}
          hideNames={hideNames}
          index={selectedResultIndex}
          label={individualLabels.get(selectedResponse.id) ?? ''}
          layout={detailPanelLayout}
          onClose={() => setSelectedResponseId(null)}
          onNext={() => stepResponse(1)}
          onPrevious={() => stepResponse(-1)}
          query={responseQuery}
          response={selectedResponse}
          total={responseResults.length}
        />
      ) : null}
    </div>
  )
}
