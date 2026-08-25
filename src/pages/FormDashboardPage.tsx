import {
  ArrowUp,
  Calendar,
  RefreshCw,
  Tag,
  TrendingUp,
  TriangleAlert,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'

import { DateRangeFilter } from '../components/dashboard/DateRangeFilter'
import { DemographicOverviewSection } from '../components/dashboard/DemographicOverviewSection'
import { SentimentGauge } from '../components/dashboard/SentimentGauge'
import { TopicSentimentCard } from '../components/dashboard/TopicSentimentCard'
import type { DashboardView } from '../components/navigation/DashboardViewTabs'
import { DashboardViewTabs } from '../components/navigation/DashboardViewTabs'
import { FormDetailTabs } from '../components/navigation/FormDetailTabs'
import { getDashboardAnalytics } from '../data/dashboardAnalytics'

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

export type FormDashboardPageProps = {
  showSidebarToggle?: boolean
  onToggleSidebar?: () => void
}

export function FormDashboardPage({
  showSidebarToggle = false,
  onToggleSidebar,
}: FormDashboardPageProps) {
  const { projectId } = useParams()
  const [activeView, setActiveView] = useState<DashboardView>('themes')
  const analytics = getDashboardAnalytics(projectId)

  if (!analytics) {
    return (
      <div>
        <FormDetailTabs
          hasDashboardData={false}
          onToggleSidebar={onToggleSidebar}
          showSidebarToggle={showSidebarToggle}
        />
        <div className="flex min-h-100 items-center justify-center px-14 py-16 text-center">
          <p className="m-0 text-[14px] text-[#726f6f]">
            No dashboard data is available for this form yet.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <FormDetailTabs
        hasDashboardData
        onToggleSidebar={onToggleSidebar}
        showSidebarToggle={showSidebarToggle}
      />

      <div className="flex flex-col gap-5 px-14 pt-5 pb-16 max-[900px]:px-6 max-[560px]:px-4">
        <DashboardViewTabs activeView={activeView} onSelectView={setActiveView} />

        <div className="mx-auto flex w-full max-w-182 flex-col gap-5">
          <div className="flex flex-col gap-1.25">
            <StatusRow
              lastUpdatedLabel={analytics.lastUpdatedLabel}
              openDateRangeLabel={analytics.openDateRangeLabel}
              status={analytics.status}
            />
            <div className="flex items-center gap-2.5 py-2.5">
              {activeView === 'response' ? (
                <TrendingUp className="shrink-0 text-[#1e55c5]" size={24} />
              ) : (
                <Tag className="shrink-0 text-[#1e55c5]" size={24} />
              )}
              <h1 className="m-0 text-[20px] font-semibold tracking-[0.2px] text-black">
                {activeView === 'response' ? 'Response Overview' : analytics.title}
              </h1>
            </div>
          </div>

          {activeView === 'themes' ? (
            <>
              <div className="flex flex-wrap items-center gap-4">
                <StatCard
                  deltaClassName="text-[#0b842d]"
                  deltaLabel={analytics.responderDeltaLabel}
                  icon={<Users className="text-[#1e55c5]" size={31} strokeWidth={1.8} />}
                  iconBgClassName="bg-[#edf2fd]"
                  label="Total Responder"
                  value={analytics.totalResponders}
                />

                <div className="flex h-29.5 w-56 shrink-0 flex-col justify-center gap-1.5 rounded-[10px] border border-[#e9eaed] bg-white px-3.75">
                  <p className="m-0 text-[12px] font-medium text-[#929292]">
                    Overall Sentiment
                  </p>
                  <div className="flex items-center gap-4.5">
                    <SentimentGauge
                      negative={analytics.sentiment.negative}
                      neutral={analytics.sentiment.neutral}
                      outOf={analytics.sentiment.outOf}
                      positive={analytics.sentiment.positive}
                      score={analytics.sentiment.score}
                    />
                    <div className="flex flex-col gap-2 text-[12px]">
                      <span className="flex items-center gap-2">
                        <span className="size-1.75 shrink-0 rounded-full bg-[rgba(236,102,131,0.8)]" />
                        <span className="text-[#929292]">
                          Negative: <span className="text-[#14181f]">{analytics.sentiment.negative}%</span>
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="size-1.75 shrink-0 rounded-full bg-[rgba(253,210,118,0.8)]" />
                        <span className="text-[#929292]">
                          Neutral: <span className="text-[#14181f]">{analytics.sentiment.neutral}%</span>
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="size-1.75 shrink-0 rounded-full bg-[rgba(156,221,153,0.8)]" />
                        <span className="text-[#929292]">
                          Positive: <span className="text-[#14181f]">{analytics.sentiment.positive}%</span>
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
                  value={analytics.highIntenseTopics.length}
                />
              </div>

              <DateRangeFilter />

              <TopicSentimentCard
                title="High Intense Topic"
                topics={analytics.highIntenseTopics}
              />

              <TopicSentimentCard
                pageSize={8}
                sortable
                title={`AI discovered topic (${analytics.aiDiscoveredTopics.length})`}
                topics={analytics.aiDiscoveredTopics}
              />
            </>
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
                    {analytics.totalResponders}
                  </p>
                </div>
              </div>

              <DemographicOverviewSection
                breakdowns={analytics.demographics}
                title="Demographic Overview"
              />

              <DemographicOverviewSection
                breakdowns={analytics.feedbackResponses}
                title="Feedback Overview"
              />
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
