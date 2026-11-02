import {
  ArrowUp,
  CircleHelp,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  MessageSquareText,
  Printer,
  RefreshCw,
  Sparkles,
  TriangleAlert,
  Users,
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import {
  downloadFormResponses,
  downloadFormThemes,
  reviewViolation,
  type FormThemeAnalytics,
  type ViolationReview,
} from '../api/analytics'
import type { ApiFormDetail } from '../api/forms'
import { formQuery, individualQuery, queryKeys, responsesQuery, themesQuery, trendQuery } from '../api/queries'
import { FormLoadError } from '../components/FormLoadError'
import { PrintPortal } from '../components/report/PrintPortal'
import { ThemesReport } from '../components/report/ThemesReport'
import { ActiveFilterBar, type ActiveFilterChip } from '../components/dashboard/ActiveFilterBar'
import { DASHBOARD_TOUR, INDIVIDUAL_TOUR, RESPONSE_TOUR, TREND_TOUR } from '../components/dashboard/dashboardTour'
import { DateRangeFilter } from '../components/dashboard/DateRangeFilter'
import { needsReview } from '../components/dashboard/violationReview'
import { ExportMenu } from '../components/dashboard/ExportMenu'
import { FeedbackFilter } from '../components/dashboard/FeedbackFilter'
import { IndividualResponseList } from '../components/dashboard/IndividualResponseList'
import { ResponseDetailPanel } from '../components/dashboard/ResponseDetailPanel'
import { ResponseOverviewSection } from '../components/dashboard/ResponseOverviewSection'
import { responseLabels } from '../components/dashboard/responseLabel'
import { filterResponses } from '../components/dashboard/responseFilter'
import { searchResponses } from '../components/dashboard/responseSearch'
import { SentimentGauge } from '../components/dashboard/SentimentGauge'
import { percentOf } from '../components/dashboard/sentimentScore'
import { TopicDetailPanel } from '../components/dashboard/TopicDetailPanel'
import { TopicPicker } from '../components/dashboard/TopicPicker'
import { type TopicChanges, TopicSentimentCard } from '../components/dashboard/TopicSentimentCard'
import { sortTopics, type TopicSortOption } from '../components/dashboard/topicSort'
import { computeAxisMax } from '../components/dashboard/topicAxis'
import { TrendView } from '../components/dashboard/TrendView'
import { TREND_SERIES_MAX } from '../components/dashboard/trendColors'
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip'
import { useHideNames } from '../hooks/useHideNames'
import { useRouteForm } from '../hooks/useRouteForm'
import { useAuth } from '../lib/auth'
import { SamplePreviewContext } from '../lib/samplePreview'
import { brand } from '../data/dashboard'
import { SAMPLE_FORM, SAMPLE_INDIVIDUAL, SAMPLE_RESPONSES, SAMPLE_THEMES, SAMPLE_TREND } from '../data/sampleDashboard'
import { startTour } from '../lib/productTour'
import { useFormEvents } from '../hooks/useFormEvents'
import { useRecordFormOpen } from '../hooks/useRecordFormOpen'
import type { DashboardView } from '../components/navigation/DashboardViewTabs'
import { DASHBOARD_VIEW_PANEL_ID, DashboardViewTabs } from '../components/navigation/DashboardViewTabs'
import { FolderBreadcrumbBar } from '../components/navigation/FolderBreadcrumb'
import { FormActionButton } from '../components/navigation/FormActionBar'
import { FormDetailTabs } from '../components/navigation/FormDetailTabs'
import { HeadroomBar } from '../components/navigation/HeadroomBar'
import { ResponseStateChip } from '../components/navigation/ResponseStateChip'
import type {
  FeedbackDateRange,
  FeedbackPoint,
  FormTrendAnalytics,
  TopicSentiment,
  TrendBucket,
  TrendRank,
} from '../data/dashboardAnalytics'
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

const VIEW_TITLES: Record<DashboardView, string> = {
  themes: 'Themes',
  trend: 'Trend',
  response: 'Response',
  individual: 'Individual responses',
}
const VIEWS = Object.keys(VIEW_TITLES) as DashboardView[]
const parseView = (value: string | null): DashboardView =>
  VIEWS.includes(value as DashboardView) ? (value as DashboardView) : 'themes'
const parseBucket = (value: string | null): BucketChoice =>
  BUCKETS.some((option) => option.value === value) ? (value as BucketChoice) : 'auto'
const parseRange = (from: string | null, to: string | null) => (from && to ? { from, to } : null)
// A hand-edited or stale link falls back to no filter rather than breaking the page.
function parseDemo(value: string | null): Record<string, string[]> {
  if (!value) return {}
  try {
    const parsed: unknown = JSON.parse(value)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string[]] =>
          Array.isArray(entry[1]) && entry[1].every((item) => typeof item === 'string'),
      ),
    )
  } catch {
    return {}
  }
}

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
        <span className="font-medium text-[#726f6f]">
          {freshness?.kind === 'ai' ? 'AI analysed' : 'Last response'}
        </span>
        {freshness ? (
          <span className="font-bold text-[#14181f]">
            {freshness.at
              ? formatDateTime(freshness.at)
              : '—'}
            {freshness.pending ? (
              <span className="font-medium text-[#726f6f]"> ({freshness.pending} pending)</span>
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
  note,
  noteTooltip,
  footer,
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
  /** A grey aside beside the big number. */
  note?: string
  /** Explains `note` on hover. */
  noteTooltip?: string
  /** Shown on the line under the number when there's no delta (e.g. the owner's "5 to review"). */
  footer?: React.ReactNode
}) {
  const Root = onClick ? 'button' : 'div'
  return (
    <Root
      className={cn(
        'flex h-29.5 min-w-0 flex-col gap-2 rounded-[10px] border border-[#e9eaed] bg-white px-3.75 pt-4 text-left',
        onClick && 'focus-visible:outline-2 focus-visible:outline-offset-2',
        onClick && 'cursor-pointer transition-colors hover:border-[#d2d8e5] hover:bg-[#fbfcfe]',
      )}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      <p className="m-0 flex w-full min-w-0 items-center gap-1.5 text-[12px] font-medium text-[#726f6f]">
        {/* The icon moves up here, small, while three cards share a narrow row. */}
        <span aria-hidden="true" className="hidden shrink-0 @min-[34rem]:@max-[50rem]:flex [&_svg]:size-3.5">
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </p>
      <div className="flex min-w-0 items-center gap-4.5 @min-[34rem]:@max-[50rem]:gap-2.5">
        <div
          aria-hidden="true"
          // Moved next to the label (above) while three cards share a narrow row.
          className={`flex size-15.25 shrink-0 items-center justify-center rounded-[6px] @min-[34rem]:@max-[50rem]:hidden ${iconBgClassName}`}
        >
          {icon}
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="m-0 flex min-w-0 items-baseline gap-2">
            <span className="text-[20px] font-bold text-[#14181f]">{value}</span>
            {/* Dotted underline only when there's something to read on hover. */}
            {note && noteTooltip ? (
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <span
                    className="cursor-help truncate rounded-[4px] text-[12px] font-medium text-[#726f6f] underline decoration-dotted underline-offset-2"
                    // Focusable (when the card isn't itself a button) so keyboard users get the explanation too.
                    tabIndex={onClick ? undefined : 0}
                  >
                    {note}
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-64 whitespace-normal leading-4.5" side="top">
                  {noteTooltip}
                </TooltipContent>
              </Tooltip>
            ) : note ? (
              <span className="truncate text-[12px] font-medium text-[#726f6f]">{note}</span>
            ) : null}
          </p>
          {/* Always one line tall, even when empty or wrapping: a second line spills into
              the card's bottom padding, so the big number never moves (and lines up across cards). */}
          <div className={`flex h-4 min-w-0 items-start gap-0.5 text-[12px] leading-4 font-medium ${deltaClassName}`}>
            {deltaLabel ? (
              <>
                <ArrowUp className="shrink-0" size={15} />
                <span className="truncate" title={deltaLabel}>
                  {deltaLabel}
                </span>
              </>
            ) : (
              footer
            )}
          </div>
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

const DEMO_ROUTE = {
  formId: SAMPLE_FORM.id,
  role: 'owner' as const,
  status: 'ready' as const,
  error: null,
  retry: () => {},
}

/** The demo's top bar, in the Edit form | Dashboard bar's place and height. */
function DemoBar({ onTour }: { onTour: () => void }) {
  return (
    <div className="flex h-12.5 items-center justify-between gap-3 border-b border-[#e8eaf1] px-6 max-[560px]:px-4">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          aria-label={`${brand.name} overview`}
          className="shrink-0 rounded-[6px] focus-visible:outline-2 focus-visible:outline-[#1e55c5]"
          to="/about"
        >
          <img alt={brand.name} className="h-7 w-13.5 object-cover object-center" src={brand.logo} />
        </Link>
        <span className="truncate rounded-full bg-[#fff4d9] px-2.5 py-1 text-[12px] font-semibold text-[#7a5a00]">
          Sample dashboard
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          className="h-8 cursor-pointer rounded-[10px] border border-[#d2d8e5] bg-white px-3 text-[13px] font-semibold text-[#3f4045] transition-colors hover:bg-[#f7f8fb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e55c5]"
          onClick={onTour}
          type="button"
        >
          Take the tour
        </button>
        <Link
          className="inline-flex h-8 items-center rounded-[10px] bg-[#1e55c5] px-3 text-[13px] font-semibold text-white transition-colors hover:bg-[#1a49aa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e55c5]"
          to="/login"
        >
          Sign in
        </Link>
      </div>
    </div>
  )
}

export type FormDashboardPageProps = {
  /**
   * The public /demo: this same page on sample data, with no server calls. Reviews stay on
   * the page, filters are off, and a demo bar replaces the Edit form | Dashboard bar.
   */
  demo?: boolean
  /** Folders containing this form, outermost first (empty: at the root of My forms). */
  folderPath?: { id: string; label: string }[]
  showSidebarToggle?: boolean
  onToggleSidebar?: () => void
}

export function FormDashboardPage({
  demo = false,
  folderPath = [],
  showSidebarToggle = false,
  onToggleSidebar,
}: FormDashboardPageProps) {
  // The URL carries the form's urlId; the API calls use its numeric id.
  const urlForm = useRouteForm()
  const routeForm = demo ? DEMO_ROUTE : urlForm
  const formId = routeForm.formId ?? 0
  const queryClient = useQueryClient()
  const hasValidId = routeForm.formId !== null
  // The demo never touches the server.
  const canFetch = hasValidId && !demo
  useRecordFormOpen(demo ? null : routeForm.formId)
  // New responses, finished AI runs and form edits show up without a refresh.
  useFormEvents(demo ? null : routeForm.formId)

  // The view and filters live in the URL, so a reload keeps them and a link opens the same view.
  const [searchParams, setSearchParams] = useSearchParams()
  const updateParams = (patch: Record<string, string | null>) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(patch)) {
          if (value === null) next.delete(key)
          else next.set(key, value)
        }
        return next
      },
      { replace: true },
    )
  const activeView = parseView(searchParams.get('view'))
  const setActiveView = (view: DashboardView) => updateParams({ view: view === 'themes' ? null : view })
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  // Opened from "N to review": the panel walks the owner through the flagged mentions.
  const [reviewing, setReviewing] = useState(false)
  // Set when the panel is opened from Trend's What changed: its feedback starts on that period.
  const [topicDateRange, setTopicDateRange] = useState<FeedbackDateRange | null>(null)
  const selectTopic = (topicId: string | null) => {
    setSelectedTopicId(topicId)
    setTopicDateRange(null)
    setReviewing(false)
  }
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
  const bucket = parseBucket(searchParams.get('bucket'))
  const [rank, setRank] = useState<TrendRank>('mentioned')
  // `null` = "let the server auto-pick the top lines for the current rank".
  const [topicSel, setTopicSel] = useState<string[] | null>(null)
  const range = parseRange(searchParams.get('from'), searchParams.get('to'))
  const { hideNames, toggleHideNames } = useHideNames()
  // Pinned line on the Trend tab's Mentions over time card (see TrendView).
  const [trendPinned, setTrendPinned] = useState<string | null>(null)
  // Themes-tab demographic filter: question label → chosen answers (server-side).
  const demoSel = useMemo(() => parseDemo(searchParams.get('demo')), [searchParams])
  const setDemoSel = (next: Record<string, string[]>) => {
    const kept = Object.entries(next).filter(([, values]) => values.length > 0)
    updateParams({ demo: kept.length > 0 ? JSON.stringify(Object.fromEntries(kept)) : null })
  }

  // Which kind of control last changed the trend query — so "Updating…" shows where
  // the change applies: on the Mentions over time card for the topic picker (it only
  // changes that chart's lines), in the filter row for page-wide filters.
  const [trendChangeScope, setTrendChangeScope] = useState<'page' | 'topic-chart'>('page')

  const changeBucket = (next: BucketChoice) => {
    setTrendChangeScope('page')
    updateParams({ bucket: next === 'auto' ? null : next })
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
    updateParams({ from: next.from, to: next.to })
  }
  const toggleDemo = (label: string, value: string) => {
    setTrendChangeScope('page')
    const current = demoSel[label] ?? []
    setDemoSel({
      ...demoSel,
      [label]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    })
  }
  const clearDemo = () => {
    setTrendChangeScope('page')
    setDemoSel({})
  }
  const resetRange = () => {
    setTrendChangeScope('page')
    updateParams({ from: null, to: null })
  }

  // Each data source is its own cached query. Changing a filter changes the
  // themes/trend query key; `keepPreviousData` (see api/queries.ts) keeps the old
  // result on screen meanwhile, which `isPlaceholderData` reports as "Updating…".
  const formResult = useQuery({ ...formQuery(formId), enabled: canFetch })
  const responsesResult = useQuery({ ...responsesQuery(formId), enabled: canFetch })
  // Every answer of every response — only fetched once the Individual tab is opened.
  const individualResult = useQuery({
    ...individualQuery(formId),
    enabled: canFetch && activeView === 'individual',
  })
  const themesResult = useQuery({
    ...themesQuery(formId, { from: range?.from, to: range?.to, demo: demoSel }),
    enabled: canFetch,
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
    enabled: canFetch,
  })

  const form = demo ? SAMPLE_FORM : (formResult.data ?? null)
  // While an empty form's tour runs, every tab shows sample data instead (see the tour
  // below); `real*` is what the server sent.
  const [tourPreviewing, setPreviewing] = useState(false)
  const previewing = demo || tourPreviewing
  // The demo's own copy of the sample themes, so a flag review shows on the page.
  const [demoThemes, setDemoThemes] = useState(SAMPLE_THEMES)
  const realResponses = responsesResult.data ?? null
  const realIndividual = individualResult.data ?? null
  const responses = previewing ? SAMPLE_RESPONSES : realResponses
  const individual = previewing ? SAMPLE_INDIVIDUAL : realIndividual

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
  const realThemes = themesResult.data ?? sameFormLastGood?.themes ?? null
  const realTrend = trendResult.data ?? sameFormLastGood?.trend ?? null
  const themes = demo ? demoThemes : previewing ? SAMPLE_THEMES : realThemes
  const trend = previewing ? SAMPLE_TREND : realTrend
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

  // A short tour the first time each tab is opened. With real data it points at the
  // real topics, charts and rows; on an empty tab it runs over sample data instead (a
  // yellow banner says so, Export / Share are off) and the real view returns when the
  // tour ends. Response explains itself, so its tour only runs from the Tour button.
  const { user } = useAuth()
  // Applies the server's answer to the cached point (and its topic's flag) right away,
  // then refreshes Themes + Trend in the background for the counts.
  const reviewPointViolation = async (pointId: string, status: ViolationReview) => {
    if (demo) {
      // Answered on the page only: nothing is saved.
      const original = SAMPLE_THEMES.aiDiscoveredTopics
        .flatMap((topic) => topic.feedbackSegment)
        .find((point) => point.id === pointId)
      const local: Partial<FeedbackPoint> =
        status === 'confirmed'
          ? { violation: original?.violation ?? true, violationStatus: 'confirmed', dismissed: false, reviewedBy: 'you' }
          : status === 'dismissed'
            ? { violation: false, dismissed: true, reviewedBy: 'you' }
            : { violation: original?.violation, violationStatus: original?.violationStatus, dismissed: false, reviewedBy: null }
      const patchLocal = (topic: TopicSentiment): TopicSentiment => {
        const feedbackSegment = topic.feedbackSegment.map((point) => (point.id === pointId ? { ...point, ...local } : point))
        return { ...topic, feedbackSegment, hasViolation: feedbackSegment.some((point) => point.violation) }
      }
      setDemoThemes((data) => ({
        ...data,
        violationTopics: data.violationTopics.map(patchLocal),
        aiDiscoveredTopics: data.aiDiscoveredTopics.map(patchLocal),
      }))
      return
    }
    const result = await reviewViolation(pointId, status)
    const patch: Partial<FeedbackPoint> = {
      ...result,
      dismissed: status === 'dismissed',
      reviewedBy: status === null ? null : (user?.fullName ?? user?.email ?? null),
    }
    const patchTopic = (topic: TopicSentiment): TopicSentiment => {
      const feedbackSegment = topic.feedbackSegment.map((point) => (point.id === pointId ? { ...point, ...patch } : point))
      return { ...topic, feedbackSegment, hasViolation: feedbackSegment.some((point) => point.violation) }
    }
    queryClient.setQueriesData<FormThemeAnalytics>({ queryKey: queryKeys.allThemes(formId) }, (data) =>
      data
        ? {
            ...data,
            violationTopics: data.violationTopics.map(patchTopic),
            aiDiscoveredTopics: data.aiDiscoveredTopics.map(patchTopic),
          }
        : data,
    )
    void queryClient.invalidateQueries({ queryKey: queryKeys.allThemes(formId) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.allTrends(formId) })
  }
  const pageTour =
    activeView === 'themes'
      ? {
          id: 'dashboard',
          steps: DASHBOARD_TOUR,
          loaded: form !== null && realThemes !== null,
          empty: (realThemes?.aiDiscoveredTopics.length ?? 0) === 0,
        }
      : activeView === 'trend'
        ? {
            id: 'dashboard-trend',
            steps: TREND_TOUR,
            loaded: realTrend !== null && realThemes !== null,
            empty: (realTrend?.topicVolumeSeries.length ?? 0) === 0,
          }
        : activeView === 'individual'
          ? {
              id: 'dashboard-individual',
              steps: INDIVIDUAL_TOUR,
              loaded: realIndividual !== null,
              empty: (realIndividual?.responses.length ?? 0) === 0,
            }
          : {
              id: 'dashboard-response',
              steps: RESPONSE_TOUR,
              loaded: form !== null && realResponses !== null,
              empty: (realResponses?.totalResponses ?? 0) === 0,
              manual: true,
            }
  // The demo's sample data is the real data here: the tour runs as on a full form.
  const tabTour = demo ? { ...pageTour, loaded: true, empty: false } : pageTour

  // The running tour, so "Exit preview" on the banner can end it too.
  const activeTour = useRef<{ stop: () => void } | null>(null)
  const runTabTour = (tour: typeof tabTour, onEnd?: () => void) => {
    const finish = () => {
      activeTour.current = null
      setPreviewing(false)
      onEnd?.()
    }
    if (!tour.empty) {
      activeTour.current = startTour(tour.steps, finish)
      return
    }
    setPreviewing(true)
    // After the sample data has rendered, so the steps have something to point at.
    setTimeout(() => {
      activeTour.current = startTour(tour.steps, finish)
    }, 80)
  }
  const exitPreview = () => {
    if (activeTour.current) activeTour.current.stop()
    else setPreviewing(false)
  }


  const loadFailure = demo
    ? null
    : routeForm.status === 'error'
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
        <HeadroomBar>
          <FormDetailTabs
            canEdit={routeForm.role === 'owner'}
            hasDashboardData={hasValidId}
            onToggleSidebar={onToggleSidebar}
            showSidebarToggle={showSidebarToggle}
          />
        </HeadroomBar>
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

  // Trend's What changed → Themes with that topic's panel open (same range + demographics).
  const openInThemes = (topicId: string) => {
    const changed = trend?.whatChanged
    setSelectedTopicId(topicId)
    setTopicDateRange(
      changed?.currentFrom && changed.currentTo
        ? { label: changed.currentLabel, from: changed.currentFrom, to: changed.currentTo }
        : null,
    )
    setActiveView('themes')
    window.scrollTo({ top: 0 })
  }

  const openIndividual = () => {
    setActiveView('individual')
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
  // A detail panel open beside the content (wide screens), rather than over it.
  const isPanelDocked = Boolean(selectedTopic || selectedResponse) && detailPanelLayout.mode === 'docked'
  const individualLabels = individual ? responseLabels(individual.responses, hideNames) : new Map<number, string>()
  // The panel's Previous / Next step through the search results, not every response.
  // The same date range and demographics as Themes, applied before the search.
  const isFilteringResponses = range !== null || Object.values(demoSel).some((values) => values.length > 0)
  const filteredResponses = individual
    ? filterResponses(individual.responses, individual.fields, range, demoSel)
    : []
  const responseResults = searchResponses(filteredResponses, individualLabels, responseQuery)
  const selectedResultIndex = responseResults.findIndex((result) => result.response.id === selectedResponseId)
  const stepResponse = (offset: number) => {
    const next = responseResults[selectedResultIndex + offset]
    if (next) setSelectedResponseId(next.response.id)
  }

    const topicAxisMax = themes ? computeAxisMax(themes.aiDiscoveredTopics) : undefined
  // Trend's What changed, already fetched with the same range and demographic filter.
  const changed = trend?.whatChanged
  const topicChanges: TopicChanges | undefined = changed
    ? {
        current: changed.currentLabel,
        previous: changed.previousLabel,
        kinds: Object.fromEntries(
          changed.rows.flatMap((row) => (row.kind === 'worse' || row.kind === 'new' ? [[row.id, row.kind]] : [])),
        ),
      }
    : undefined
  const showViolationTopics = () => {
    document.getElementById(TOPIC_LIST_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  // Topics with flags still to review, in Priority order (the list's default).
  const reviewTopics = themes
    ? sortTopics(themes.aiDiscoveredTopics, 'priority').filter((topic) => topic.feedbackSegment.some(needsReview))
    : []
  const openReview = (topicId: string) => {
    setSelectedTopicId(topicId)
    setTopicDateRange(null)
    setReviewing(true)
  }

  const sentimentTotal = themes
    ? themes.sentiment.negative + themes.sentiment.neutral + themes.sentiment.positive
    : 0

  // Shown whether or not the feedback has been analysed yet, so the responder count
  // is always visible. One row of three whenever the space allows: equal when there's
  // room, else Sentiment widest (its gauge), with the stat cards' icons hidden —
  // sized by the column, which the topic panel narrows, not the screen.
  // Flags the owner hasn't confirmed or dismissed yet, same rule as the panel's "Needs review".
  const reviewCount = (themes?.aiDiscoveredTopics ?? []).reduce(
    (sum, topic) => sum + topic.feedbackSegment.filter(needsReview).length,
    0,
  )
  // Still-standing flags (confirmed or not; dismissed ones are no longer `violation`).
  const violationMentions = (themes?.aiDiscoveredTopics ?? []).reduce(
    (sum, topic) => sum + topic.feedbackSegment.filter((point) => point.violation).length,
    0,
  )
  const isOwner = routeForm.role === 'owner'

  const themesStatCards = themes ? (
    <div className="@container">
      <div className="grid grid-cols-1 gap-4 @min-[34rem]:grid-cols-[1fr_1.25fr_1fr] @min-[50rem]:grid-cols-3">
        <StatCard
          deltaClassName="text-[#0b842d]"
          deltaLabel={themes.responderDelta > 0 ? themes.responderDeltaLabel : undefined}
          icon={<Users className="text-[#1e55c5]" size={31} strokeWidth={1.8} />}
          iconBgClassName="bg-[#edf2fd]"
          label="Total responses"
          note={themes.awaitingAnalysis ? `${themes.awaitingAnalysis} pending analysis` : undefined}
          noteTooltip="AI analysis runs automatically. These responses are counted here, but their feedback won't appear in topics or sentiment until they're analysed."
          value={themes.totalResponders}
        />

        <div className="flex h-29.5 min-w-0 flex-col rounded-[10px] border border-[#e9eaed] bg-white px-3.75 pt-4">
          <p className="m-0 text-[12px] font-medium text-[#726f6f]">Overall sentiment</p>
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
                <span className="text-[#726f6f]">
                  Negative: <span className={sentimentTotal === 0 ? 'text-[#726f6f]' : 'text-[#14181f]'}>{percentOf(themes.sentiment.negative, sentimentTotal)}%</span>
                </span>
              </span>
              <span className="flex items-center gap-2">
                <span className={cn('size-1.75 shrink-0 rounded-full', sentimentTotal === 0 ? 'bg-[#d2d8e5]' : 'bg-[rgba(253,210,118,0.8)]')} />
                <span className="text-[#726f6f]">
                  Neutral: <span className={sentimentTotal === 0 ? 'text-[#726f6f]' : 'text-[#14181f]'}>{percentOf(themes.sentiment.neutral, sentimentTotal)}%</span>
                </span>
              </span>
              <span className="flex items-center gap-2">
                <span className={cn('size-1.75 shrink-0 rounded-full', sentimentTotal === 0 ? 'bg-[#d2d8e5]' : 'bg-[rgba(156,221,153,0.8)]')} />
                <span className="text-[#726f6f]">
                  Positive: <span className={sentimentTotal === 0 ? 'text-[#726f6f]' : 'text-[#14181f]'}>{percentOf(themes.sentiment.positive, sentimentTotal)}%</span>
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Everyone sees the same total; the owner also gets what's left to review. */}
        <StatCard
          deltaClassName="text-[#881921]"
          footer={
            isOwner && violationMentions > 0 ? (
              reviewCount > 0 ? (
                <span className="font-semibold whitespace-nowrap text-[#c2365f]">{reviewCount} to review</span>
              ) : (
                <span className="whitespace-nowrap text-[#726f6f]">All reviewed</span>
              )
            ) : null
          }
          icon={<TriangleAlert className="text-[#e0507a]" size={28} strokeWidth={1.8} />}
          iconBgClassName="bg-[#ffeaeb]"
          label="Violation mentions"
          note={
            themes.violationTopics.length > 0
              ? `in ${themes.violationTopics.length} ${themes.violationTopics.length === 1 ? 'topic' : 'topics'}`
              : undefined
          }
          onClick={
            isOwner && reviewTopics[0]
              ? () => openReview(reviewTopics[0]!.id)
              : themes.violationTopics.length > 0
                ? showViolationTopics
                : undefined
          }
          value={violationMentions}
        />
      </div>
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
  // The demo's filters would need the server: shown, but off.
  const lockForDemo = (node: React.ReactNode) =>
    demo ? (
      <div className="flex flex-col gap-1.5">
        <fieldset className="m-0 min-w-0 border-0 p-0 opacity-60" disabled>
          {node}
        </fieldset>
        <p className="m-0 text-[12px] text-[#726f6f]">Filters work on your own forms.</p>
      </div>
    ) : (
      node
    )
  // Date range + demographics, shared by Themes and Individual (Trend has its own row).
  const filterRow = (pending: boolean) =>
    themes ? lockForDemo(
      <div className="flex flex-wrap items-end gap-3" data-tour="dashboard-filters">
        <DateRangeFilter
          isDefault={range === null}
          label={range === null ? themes.rangeLabel : undefined}
          onChange={changeRange}
          onReset={resetRange}
          value={range ?? { from: themes.from, to: themes.to }}
        />
        {demoFilterControl}
        {pending ? <UpdatingIndicator /> : null}
      </div>,
    ) : null

  const activeFilterBar = (
    <ActiveFilterBar
      chips={activeFilterChips}
      // Pulled up under the filter row it belongs to (the column's gap is 20px).
      className="-mt-2"
      onClearAll={() => {
        setTrendChangeScope('page')
        updateParams({ from: null, to: null, demo: null })
      }}
    />
  )

  return (
    <SamplePreviewContext.Provider value={previewing}>
      <div>
        <HeadroomBar>
          {demo ? (
            <DemoBar onTour={() => runTabTour(tabTour)} />
          ) : (
            <FormDetailTabs
              canEdit={routeForm.role === 'owner'}
              hasDashboardData
              onToggleSidebar={onToggleSidebar}
              showSidebarToggle={showSidebarToggle}
            />
          )}
        </HeadroomBar>
        {previewing && !demo ? (
          // Top centre, in the empty middle of the Edit form | Dashboard bar (tabs left, Share
          // right); under 900px that middle is too narrow, so it sits at the bottom instead.
          // Above the tour's dimmed overlay (driver.js: z-index 10000) on every step.
          // `!pointer-events-auto`: during a tour driver.js makes everything else
          // unclickable, and Exit preview must still work.
          <div
            className="fixed top-2 left-1/2 z-[10001] flex !pointer-events-auto -translate-x-1/2 items-center gap-2.5 rounded-[10px] border border-[#f3d27a] bg-[#fff6d6] py-1.5 pr-1.5 pl-2 text-[13px] font-medium whitespace-nowrap text-[#7a5a00] shadow-[0_8px_24px_rgba(15,23,42,0.14)] max-[900px]:top-auto max-[900px]:bottom-5"
            role="status"
          >
            {/* A tinted icon tile like the dashboard's stat cards, in the notice's amber. */}
            <Eye className="text-[#7a5a00]" size={14} />
            You're viewing sample data
            <button
              className="!pointer-events-auto h-7 cursor-pointer rounded-[10px] border border-[#f3d27a] bg-white px-2.5 text-[12px] font-semibold text-[#7a5a00] transition-colors hover:bg-[#fffbeb]"
              onClick={exitPreview}
              type="button"
            >
              Exit preview
            </button>
          </div>
        ) : null}
        <FolderBreadcrumbBar
          reserveRight={
            isPanelDocked
              ? detailPanelLayout.width
              : undefined
          }
          actions={
            <>
              {/* Help, not an action: just the ? icon, borderless, so it doesn't compete with Export. */}
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <button
                    aria-label="Show the tour for this tab"
                    className="inline-flex size-9.5 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border-0 bg-transparent text-[#726f6f] transition-colors hover:bg-[#eef1f6] hover:text-[#3f4045]"
                    onClick={() => {
                      if (tabTour.loaded) runTabTour(tabTour)
                    }}
                    type="button"
                  >
                    <CircleHelp size={20} strokeWidth={2.2} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Show tour</TooltipContent>
              </Tooltip>
              {/* Styled like the editor's action buttons; pressed = names shown, off while screen-sharing. */}
              {hasNames ? (
                <FormActionButton
                  aria-pressed={!hideNames}
                  data-tour="show-names"
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
                  disabled={previewing}
                  formTitle={form.formTitle}
                  includeNames={!hasNames || !hideNames}
                  options={[
                    {
                      label: 'Excel (.xlsx)',
                      description: 'Every response, plus a count per question',
                      icon: FileSpreadsheet,
                      extension: 'xlsx',
                      download: () => downloadFormResponses(formId, 'xlsx', !hideNames),
                    },
                    {
                      label: 'CSV (.csv)',
                      description: 'Every response, as a plain table for other tools',
                      icon: FileText,
                      extension: 'csv',
                      download: () => downloadFormResponses(formId, 'csv', !hideNames),
                    },
                  ]}
                  heading="Raw answers, one row per response"
                  what="responses"
                />
              ) : null}
              {/* Exports what's on screen: the same date range and demographic filter. */}
              {activeView === 'themes' && form && themes && themes.totalMentions > 0 ? (
                <ExportMenu
                  disabled={previewing}
                  formTitle={form.formTitle}
                  includeNames={!hasNames || !hideNames}
                  options={[
                    {
                      label: 'Excel (.xlsx)',
                      description: 'Topics with their sentiment, and every mention',
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
                    {
                      label: 'PDF report',
                      description: 'This page, ready to print or share',
                      icon: Printer,
                      run: () => setPrintingReport(true),
                    },
                  ]}
                  heading="What the AI found in written answers"
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

        <div className="animate-in duration-300 fade-in-0 motion-reduce:animate-none flex flex-col gap-3 px-10 pb-16 max-[900px]:px-6 max-[560px]:px-4">
          <div className="w-fit" data-tour="dashboard-views">
            <DashboardViewTabs activeView={activeView} onSelectView={setActiveView} />
          </div>

          <div
            className="w-full"
            style={isPanelDocked ? { paddingRight: detailPanelLayout.width } : undefined}
          >
            <div
              aria-label={VIEW_TITLES[activeView]}
              id={DASHBOARD_VIEW_PANEL_ID}
              role="tabpanel"
              className={cn(
                'mx-auto flex w-full flex-col gap-5',
                // Every tab is the same width, so switching doesn't shift the page. A docked
                // detail panel shrinks the content down to min-w-150 (which useDetailPanelLayout
                // assumes). Only then: always on, it'd make phones zoom out to fit 600px.
                'max-w-366.5',
                isPanelDocked && 'min-w-150',
              )}
            >
              {/* The tab already names the view; the heading stays for screen readers' outline. */}
              <h2 className="sr-only">{VIEW_TITLES[activeView]}</h2>

              {activeView === 'themes' ? (
                !themes ? (
                  <ContentSkeleton label="Loading themes…" />
                ) : themes.aiDiscoveredTopics.length === 0 ? (
                  <>
                    {themes.totalMentions > 0 ? (
                      filterRow(themesPending)
                    ) : null}
                    {themes.totalMentions > 0 ? activeFilterBar : null}
                    {themesStatCards}
                    <EmptyNote>
                      {themes.totalMentions === 0
                        ? responses?.totalResponses === 0
                          ? 'No responses yet. Share the form’s link to start collecting feedback.'
                          : themes.awaitingAnalysis
                            ? `Analysis is in progress for ${themes.awaitingAnalysis} ${themes.awaitingAnalysis === 1 ? 'response' : 'responses'}. Topics will appear here when it finishes, without a refresh.`
                            : 'No themes yet. None of the written answers so far have been grouped into topics.'
                        : `This form has analysed feedback, but none falls in ${themes.rangeLabel}${activeDemoCount > 0 ? ' for the selected demographics' : ''}. Try “All feedback”, a wider date range${activeDemoCount > 0 ? ' or fewer demographic filters' : ''}.`}
                    </EmptyNote>
                  </>
                ) : (
                  <>
                    {filterRow(themesPending)}
                    {activeFilterBar}
                    {themesStatCards}

                    <TopicSentimentCard
                      axisMax={topicAxisMax}
                      changes={topicChanges}
                      id={TOPIC_LIST_ID}
                      onQueryChange={setTopicQuery}
                      onSortChange={setTopicSort}
                      onSelectTopic={selectTopic}
                      pageSize={15}
                      query={topicQuery}
                      sort={topicSort}
                      selectedTopicId={selectedTopicId}
                      sortable
                      title={`Topics found by AI (${themes.aiDiscoveredTopics.length})`}
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
                        <p className="m-0 text-[12px] font-medium text-[#726f6f]">Total responses</p>
                        <p className="m-0 text-[20px] font-bold text-[#14181f]">
                          {responses.totalResponses}
                        </p>
                      </div>
                    </div>

                    {responses.totalResponses === 0 ? (
                      <div className="flex min-h-40 items-center justify-center rounded-[15px] border border-dashed border-[#d2d8e5] bg-white px-6 py-10 text-center">
                        <p className="m-0 text-[14px] text-[#726f6f]">
                          No responses yet. Share the form’s link to start collecting feedback.
                        </p>
                      </div>
                    ) : (
                      <>
                        <ResponseOverviewSection
                          breakdowns={responses.demographic}
                          hideNames={hideNames}
                          onSearchAll={openIndividual}
                          title="Demographic overview"
                          tourId="response-demographic"
                        />
                        <ResponseOverviewSection
                          breakdowns={responses.feedback}
                          hideNames={hideNames}
                          onSearchAll={openIndividual}
                          title="Feedback overview"
                          tourId="response-feedback"
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
                  <>
                  {filterRow(false)}
                  {activeFilterBar}
                  <IndividualResponseList
                    filtered={isFilteringResponses}
                    labels={individualLabels}
                    onQueryChange={setResponseQuery}
                    onSelect={setSelectedResponseId}
                    query={responseQuery}
                    results={responseResults}
                    selectedId={selectedResponse?.id ?? null}
                    total={individual.responses.length}
                  />
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
                lockForDemo(
                <div className="flex flex-wrap items-end gap-3">
                  <DateRangeFilter
                    isDefault={range === null}
                    label={range === null ? trend.rangeLabel : undefined}
                    onChange={changeRange}
                    onReset={resetRange}
                    value={range ?? { from: trend.from, to: trend.to }}
                  />
                  {demoFilterControl}
                  <div className="flex flex-col items-start gap-2" data-tour="trend-bucket">
                    <span className="text-[12px] font-medium text-[#3f4045]" id="trend-bucket-label">Summarise by:</span>
                    <div
                      aria-labelledby="trend-bucket-label"
                      className="inline-flex overflow-hidden rounded-[10px] border border-[#1e55c5]"
                      role="group"
                    >
                      {BUCKETS.map((option) => (
                        <button
                          className={cn(
                            'h-10.75 cursor-pointer px-3 text-[12px] font-semibold whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-[#14181f] focus-visible:outline-none focus-visible:ring-inset',
                            option.value === bucket
                              ? 'bg-[#1e55c5] text-white'
                              : 'bg-white text-[#1e55c5] hover:bg-[#f7f8fb]',
                          )}
                          aria-pressed={option.value === bucket}
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
                </div>,
                )
              ) : null}
              {activeView === 'trend' && trendReady && trend.totalMentions > 0 ? activeFilterBar : null}

              {activeView === 'trend' && trendReady ? (
                trend.topicVolumeSeries.length > 0 ? (
                  <TrendView
                    topicControl={
                      // The picker re-asks the server, so the demo leaves it out.
                      trend.availableTopics.length > 0 && !demo ? (
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
                    onTopicOpen={openInThemes}
                    onTopicSelect={compareInTrend}
                    pinned={trendPinned}
                    trend={trend}
                  />
                ) : trend.totalMentions === 0 ? (
                  <EmptyNote>
                    No feedback has been analysed yet. Analysis starts by itself once responses
                    come in.
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
            initialDateRange={topicDateRange}
            key={`${openTopic.id}-${topicDateRange?.from ?? ''}-${reviewing}`}
            mainDemoSelection={demoSel}
            onClose={() => selectTopic(null)}
            reviewing={
              reviewing && isOwner
                ? (() => {
                    const others = reviewTopics.filter((topic) => topic.id !== openTopic.id)
                    return { topicsLeft: others.length, onNext: others[0] ? () => openReview(others[0]!.id) : undefined }
                  })()
                : undefined
            }
            hideNames={hideNames}
            onCompareInTrend={() => compareInTrend(openTopic.id)}
            onReviewViolation={routeForm.role === 'owner' ? reviewPointViolation : undefined}
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
            onOpenTopic={(topicId) => {
              selectTopic(topicId)
              setActiveView('themes')
              window.scrollTo({ top: 0 })
            }}
            openableTopicIds={new Set(themes?.aiDiscoveredTopics.map((topic) => topic.id))}
            query={responseQuery}
            response={selectedResponse}
            total={responseResults.length}
          />
        ) : null}
      </div>
    </SamplePreviewContext.Provider>
  )
}
