import {
  ArrowUp,
  Calendar,
  RefreshCw,
  Tag,
  TrendingUp,
  TriangleAlert,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import {
  getFormResponseAnalytics,
  getFormThemeAnalytics,
  type FormResponseAnalytics,
  type FormThemeAnalytics,
} from '../api/analytics'
import { getForm, type ApiFormDetail } from '../api/forms'
import { DateRangeFilter } from '../components/dashboard/DateRangeFilter'
import { DemographicOverviewSection } from '../components/dashboard/DemographicOverviewSection'
import { SentimentGauge } from '../components/dashboard/SentimentGauge'
import { TopicDetailPanel } from '../components/dashboard/TopicDetailPanel'
import { TopicSentimentCard } from '../components/dashboard/TopicSentimentCard'
import { TrendView } from '../components/dashboard/TrendView'
import type { DashboardView } from '../components/navigation/DashboardViewTabs'
import { DashboardViewTabs } from '../components/navigation/DashboardViewTabs'
import { FormDetailTabs } from '../components/navigation/FormDetailTabs'
import { getDashboardAnalytics } from '../data/dashboardAnalytics'
import { useDetailPanelWidth } from '../hooks/useDetailPanelWidth'
import { ApiError } from '../lib/api'
import { formatRelativeTime } from '../lib/formatRelativeTime'
import { formatDateTime } from '../lib/responseWindow'
import { cn } from '../lib/utils'

function StatusRow({
  status,
  openDateRangeLabel,
  lastUpdatedLabel,
}: {
  status: string
  openDateRangeLabel: string
  lastUpdatedLabel: string
}) {
  return (
    <div className="flex items-center gap-5">
      <span className="inline-flex h-8.5 items-center gap-1.25 rounded-full bg-[#eaf9ec] px-2 text-[14px] font-semibold text-[#08882c]">
        <span className="size-2.75 rounded-full bg-[#08882c]" aria-hidden="true" />
        {status}
      </span>
      <span className="inline-flex items-center gap-1.5 text-[12px]">
        <Calendar className="text-[#3f4045]" size={22} strokeWidth={1.8} />
        <span className="font-medium text-[#929292]">Open</span>
        <span className="font-bold text-[#14181f]">{openDateRangeLabel}</span>
      </span>
      <span className="inline-flex items-center gap-1.5 text-[12px]">
        <RefreshCw className="text-[#3f4045]" size={22} strokeWidth={1.8} />
        <span className="font-medium text-[#929292]">Last update</span>
        <span className="font-bold text-[#14181f]">{lastUpdatedLabel}</span>
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
  deltaLabel: string
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
        <div className={`flex items-center gap-0.5 text-[12px] font-medium ${deltaClassName}`}>
          <ArrowUp size={15} />
          {deltaLabel}
        </div>
      </div>
    </div>
  )
}

/** Placeholder for tabs still on mock data (Themes / Trend) when a real form is open. */
function NotWiredNote({ label }: { label: string }) {
  return (
    <div className="flex min-h-60 items-center justify-center rounded-[15px] border border-dashed border-[#d2d8e5] bg-white px-6 py-12 text-center">
      <p className="m-0 max-w-100 text-[14px] leading-6 text-[#726f6f]">
        {label} is produced by the AI analysis pipeline and isn’t wired to live data yet — only the
        Response tab is.
      </p>
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

  const [activeView, setActiveView] = useState<DashboardView>('response')
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const detailPanelWidth = useDetailPanelWidth()

  const [loadStatus, setLoadStatus] = useState<'loading' | 'error' | 'ready'>(
    hasValidId ? 'loading' : 'error',
  )
  const [loadError, setLoadError] = useState(
    hasValidId ? '' : "This form hasn't been saved yet, so there's no dashboard.",
  )
  const [form, setForm] = useState<ApiFormDetail | null>(null)
  const [responses, setResponses] = useState<FormResponseAnalytics | null>(null)
  const [themes, setThemes] = useState<FormThemeAnalytics | null>(null)

  // The Trend tab still reads the design mock (keyed by slug); real numeric-id forms
  // won't match, so it shows a placeholder for now. Themes & Response are live.
  const mockAnalytics = getDashboardAnalytics(projectId)

  useEffect(() => {
    if (!hasValidId) {
      return
    }

    let cancelled = false

    Promise.all([
      getForm(formId),
      getFormResponseAnalytics(formId),
      getFormThemeAnalytics(formId),
    ])
      .then(([detail, responseAnalytics, themeAnalytics]) => {
        if (cancelled) return
        setForm(detail)
        setResponses(responseAnalytics)
        setThemes(themeAnalytics)
        setLoadStatus('ready')
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setLoadError(error instanceof ApiError ? error.message : 'Could not load this dashboard.')
        setLoadStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [formId, hasValidId])

  if (loadStatus !== 'ready' || !form || !responses || !themes) {
    return (
      <div>
        <FormDetailTabs
          hasDashboardData={hasValidId}
          onToggleSidebar={onToggleSidebar}
          showSidebarToggle={showSidebarToggle}
        />
        <div className="flex min-h-100 items-center justify-center px-14 py-16 text-center">
          <p className="m-0 text-[14px] text-[#726f6f]">
            {loadStatus === 'error' ? loadError : 'Loading dashboard…'}
          </p>
        </div>
      </div>
    )
  }

  const selectedTopic =
    activeView === 'themes'
      ? ([...themes.highIntenseTopics, ...themes.aiDiscoveredTopics].find(
          (topic) => topic.id === selectedTopicId,
        ) ?? null)
      : null

  const noResponses = responses.totalResponses === 0

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
              <StatusRow
                lastUpdatedLabel={formatRelativeTime(form.updatedAt)}
                openDateRangeLabel={openRangeLabel(form)}
                status={form.status === 'active' ? 'Active' : 'Closed'}
              />
              <div className="flex items-start justify-between gap-2.5 py-2.5">
                <div className="flex items-center gap-2.5">
                  {activeView === 'themes' ? (
                    <Tag className="shrink-0 text-[#1e55c5]" size={24} />
                  ) : (
                    <TrendingUp className="shrink-0 text-[#1e55c5]" size={24} />
                  )}
                  <h1 className="m-0 text-[20px] font-semibold tracking-[0.2px] text-black">
                    {activeView === 'themes'
                      ? themes.title
                      : activeView === 'trend'
                        ? 'Trend Overview'
                        : 'Response Overview'}
                  </h1>
                </div>
                {activeView === 'trend' ? <DateRangeFilter /> : null}
              </div>
            </div>

            {activeView === 'themes' ? (
              themes.aiDiscoveredTopics.length === 0 ? (
                <div className="flex min-h-60 items-center justify-center rounded-[15px] border border-dashed border-[#d2d8e5] bg-white px-6 py-12 text-center">
                  <p className="m-0 max-w-100 text-[14px] leading-6 text-[#726f6f]">
                    No themes yet — the AI pipeline hasn’t analysed this form’s feedback into topics.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-4">
                    <StatCard
                      deltaClassName="text-[#0b842d]"
                      deltaLabel={themes.responderDeltaLabel}
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
                        />
                        <div className="flex flex-col gap-2 text-[12px]">
                          <span className="flex items-center gap-2">
                            <span className="size-1.75 shrink-0 rounded-full bg-[rgba(236,102,131,0.8)]" />
                            <span className="text-[#929292]">
                              Negative: <span className="text-[#14181f]">{themes.sentiment.negative}%</span>
                            </span>
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="size-1.75 shrink-0 rounded-full bg-[rgba(253,210,118,0.8)]" />
                            <span className="text-[#929292]">
                              Neutral: <span className="text-[#14181f]">{themes.sentiment.neutral}%</span>
                            </span>
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="size-1.75 shrink-0 rounded-full bg-[rgba(156,221,153,0.8)]" />
                            <span className="text-[#929292]">
                              Positive: <span className="text-[#14181f]">{themes.sentiment.positive}%</span>
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <StatCard
                      deltaClassName="text-[#881921]"
                      deltaLabel="needs attention"
                      icon={<TriangleAlert className="text-[#e0507a]" size={28} strokeWidth={1.8} />}
                      iconBgClassName="bg-[#ffeaeb]"
                      label="High Intense Topic"
                      value={themes.highIntenseTopics.length}
                    />
                  </div>

                  <DateRangeFilter />

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

                {noResponses ? (
                  <div className="flex min-h-40 items-center justify-center rounded-[15px] border border-dashed border-[#d2d8e5] bg-white px-6 py-10 text-center">
                    <p className="m-0 text-[14px] text-[#726f6f]">
                      No responses have been submitted yet.
                    </p>
                  </div>
                ) : (
                  <>
                    <DemographicOverviewSection
                      breakdowns={responses.demographic}
                      title="Demographic Overview"
                    />
                    <DemographicOverviewSection
                      breakdowns={responses.feedback}
                      title="Feedback Overview"
                    />
                  </>
                )}
              </>
            ) : null}

            {activeView === 'trend' ? (
              mockAnalytics ? <TrendView trend={mockAnalytics.trend} /> : <NotWiredNote label="Trend analysis" />
            ) : null}
          </div>
        </div>
      </div>

      {selectedTopic ? (
        <TopicDetailPanel
          key={selectedTopic.id}
          onClose={() => setSelectedTopicId(null)}
          topic={selectedTopic}
          width={detailPanelWidth}
        />
      ) : null}
    </div>
  )
}
