import { ArrowDown, ArrowUp, Frown, Smile, TrendingDown, TrendingUp } from 'lucide-react'
import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'

import type {
  EmergingIssue,
  FormTrendAnalytics,
  TopicMovement,
  TrendTimelineEvent,
  TrendTopicSeries,
} from '../../data/dashboardAnalytics'

const DAYS = 31

// Line colors for the "Topic Trends (by volume)" chart, in series order (Figma).
const TOPIC_TREND_COLORS = ['#7156F1', '#177CFD', '#51C66D', '#FEB535', '#F63B56']

// Rough start / end volume per series so the generated walk reads like the design
// (first series climbs the most, last two stay low) without hand-typing 155 points.
const TREND_SHAPE: { start: number; end: number }[] = [
  { start: 34, end: 88 },
  { start: 26, end: 46 },
  { start: 12, end: 36 },
  { start: 9, end: 11 },
  { start: 6, end: 9 },
]

const SENTIMENT_AREA = {
  positive: '#B5E6B1',
  neutral: '#FED871',
  negative: '#FD798F',
} as const

const SENTIMENT_DOT = {
  negative: '#F63B56',
  neutral: '#FEB535',
  positive: '#51C66D',
} as const

const AXIS_TICK = { fill: '#73777e', fontSize: 10 } as const

function hashString(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0
  }
  return Math.abs(hash)
}

function seededRandom(seed: number) {
  let state = seed || 1
  return () => {
    state = (state * 9301 + 49297) % 233280
    return state / 233280
  }
}

function buildVolumeData(series: TrendTopicSeries[]) {
  const walks = series.map((entry, index) => {
    const random = seededRandom(hashString(entry.id))
    const shape = TREND_SHAPE[index] ?? { start: 10, end: 40 }
    return Array.from({ length: DAYS }, (_unused, day) => {
      const base = shape.start + (shape.end - shape.start) * (day / (DAYS - 1))
      const value = base + (random() - 0.5) * 14
      return Math.round(Math.min(100, Math.max(0, value)))
    })
  })

  return Array.from({ length: DAYS }, (_unused, day) => {
    const row: Record<string, number | string> = { day: `Jan ${day + 1}` }
    series.forEach((entry, index) => {
      row[entry.id] = walks[index][day]
    })
    return row
  })
}

function buildSentimentData() {
  const random = seededRandom(hashString('sentiment-trend'))
  return Array.from({ length: DAYS }, (_unused, day) => {
    const negativeWeight = 30 + random() * 14 + day * 0.15
    const neutralWeight = 16 + random() * 12
    const positiveWeight = 44 + random() * 14
    const total = negativeWeight + neutralWeight + positiveWeight
    const negative = Math.round((negativeWeight / total) * 100)
    const neutral = Math.round((neutralWeight / total) * 100)
    return {
      day: `Jan ${day + 1}`,
      negative,
      neutral,
      positive: 100 - negative - neutral,
    }
  })
}

function formatEventDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-[12px] leading-5 text-[#404040]">{label}</span>
    </span>
  )
}

function ChartCard({
  title,
  legend,
  chartHeight,
  children,
}: {
  title: string
  legend: React.ReactNode
  chartHeight: number
  children: React.ReactElement
}) {
  return (
    <section className="flex flex-col rounded-[15px] border border-[#e9eaed] bg-white px-5.5 pt-2.5 pb-5">
      <h2 className="m-0 text-[16px] leading-9.25 font-semibold tracking-[0.16px] text-black">
        {title}
      </h2>
      <div className="flex flex-wrap items-center gap-x-3.75 gap-y-1.5 pt-1 pb-2">{legend}</div>
      <div className="w-full" style={{ height: chartHeight }}>
        <ResponsiveContainer height="100%" width="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </section>
  )
}

function TopicTrendsCard({ series }: { series: TrendTopicSeries[] }) {
  const data = useMemo(() => buildVolumeData(series), [series])

  return (
    <ChartCard
      chartHeight={224}
      legend={series.map((entry, index) => (
        <LegendDot
          color={TOPIC_TREND_COLORS[index % TOPIC_TREND_COLORS.length]}
          key={entry.id}
          label={entry.label}
        />
      ))}
      title="Topic Trends (by volume)"
    >
      <LineChart data={data} margin={{ top: 12, right: 18, bottom: 0, left: 4 }}>
        <CartesianGrid stroke="#f3f5f8" vertical={false} />
        <XAxis axisLine={false} dataKey="day" interval={4} tick={AXIS_TICK} tickLine={false} />
        <YAxis
          axisLine={false}
          domain={[0, 100]}
          tick={AXIS_TICK}
          tickLine={false}
          ticks={[0, 25, 50, 75, 100]}
          width={40}
        />
        {series.map((entry, index) => (
          <Line
            dataKey={entry.id}
            dot={false}
            isAnimationActive={false}
            key={entry.id}
            stroke={TOPIC_TREND_COLORS[index % TOPIC_TREND_COLORS.length]}
            strokeWidth={2}
            type="monotone"
          />
        ))}
      </LineChart>
    </ChartCard>
  )
}

function SentimentTrendCard() {
  const data = useMemo(() => buildSentimentData(), [])

  return (
    <ChartCard
      chartHeight={184}
      legend={(['negative', 'neutral', 'positive'] as const).map((key) => (
        <LegendDot
          color={SENTIMENT_DOT[key]}
          key={key}
          label={key[0].toUpperCase() + key.slice(1)}
        />
      ))}
      title="Sentiment Trend"
    >
      <AreaChart data={data} margin={{ top: 12, right: 18, bottom: 0, left: 4 }}>
        <CartesianGrid stroke="#f3f5f8" vertical={false} />
        <XAxis axisLine={false} dataKey="day" interval={4} tick={AXIS_TICK} tickLine={false} />
        <YAxis
          axisLine={false}
          domain={[0, 100]}
          tick={AXIS_TICK}
          tickFormatter={(value: number) => `${value}%`}
          tickLine={false}
          ticks={[0, 25, 50, 75, 100]}
          width={44}
        />
        <Area
          dataKey="positive"
          fill={SENTIMENT_AREA.positive}
          fillOpacity={1}
          isAnimationActive={false}
          stackId="sentiment"
          stroke={SENTIMENT_AREA.positive}
          type="monotone"
        />
        <Area
          dataKey="neutral"
          fill={SENTIMENT_AREA.neutral}
          fillOpacity={1}
          isAnimationActive={false}
          stackId="sentiment"
          stroke={SENTIMENT_AREA.neutral}
          type="monotone"
        />
        <Area
          dataKey="negative"
          fill={SENTIMENT_AREA.negative}
          fillOpacity={1}
          isAnimationActive={false}
          stackId="sentiment"
          stroke={SENTIMENT_AREA.negative}
          type="monotone"
        />
      </AreaChart>
    </ChartCard>
  )
}

function SentimentDelta({
  face,
  value,
}: {
  face: 'positive' | 'negative'
  value: number
}) {
  const Face = face === 'positive' ? Smile : Frown
  const Arrow = value >= 0 ? ArrowUp : ArrowDown
  const tone = face === 'positive' ? 'text-[#269d42]' : 'text-[#f63b56]'

  return (
    <div className="flex w-8.5 flex-col items-center gap-0.5">
      <Face className="text-[#3f4045]" size={15} />
      <span className={`flex items-center gap-0.5 text-[10px] font-medium tracking-[0.1px] ${tone}`}>
        <Arrow size={12} />
        {Math.abs(value)}%
      </span>
    </div>
  )
}

function TopicMovementRow({ row }: { row: TopicMovement }) {
  const VolumeArrow = row.volumeChange >= 0 ? ArrowUp : ArrowDown

  return (
    <div className="flex items-center gap-2 py-2.5 pr-1 pl-2.5">
      <span className="min-w-0 flex-1 truncate text-[12px] font-semibold tracking-[0.12px] text-black">
        {row.label}
      </span>
      <div className="flex w-36 shrink-0 items-center justify-between">
        <span className="flex items-center gap-0.5 text-[12px] font-semibold tracking-[0.12px] text-black">
          <VolumeArrow size={15} />
          {Math.abs(row.volumeChange)}%
        </span>
        <div className="flex items-center gap-1">
          <SentimentDelta face="positive" value={row.positiveChange} />
          <SentimentDelta face="negative" value={row.negativeChange} />
        </div>
      </div>
    </div>
  )
}

function TopicMovementCard({
  title,
  icon,
  comparisonLabel,
  rows,
}: {
  title: string
  icon: React.ReactNode
  comparisonLabel: string
  rows: TopicMovement[]
}) {
  return (
    <section className="flex flex-col gap-2 rounded-[15px] border border-[#f3f4f5] bg-white px-2 py-2">
      <div className="flex h-7 items-center gap-2.5 pl-2.25">
        {icon}
        <h3 className="m-0 text-[16px] leading-9.25 font-semibold tracking-[0.16px] text-black">
          {title}
        </h3>
      </div>
      <div className="flex items-start justify-between gap-2 pr-1 pl-2.5 text-[10px] leading-4.5 font-medium tracking-[0.1px] text-[#73777e]">
        <span className="min-w-0">Topic: Change ({comparisonLabel})</span>
        <div className="flex w-36 shrink-0 items-center justify-between">
          <span>Volume</span>
          <span>Sentiment</span>
        </div>
      </div>
      <div className="flex flex-col">
        {rows.map((row) => (
          <TopicMovementRow key={row.id} row={row} />
        ))}
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
                  {event.change}%
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
}

export function TrendView({ trend }: TrendViewProps) {
  return (
    <div className="grid grid-cols-[795fr_653fr] gap-4.5 max-[1160px]:grid-cols-1">
      <div className="@container flex min-w-0 flex-col gap-4.5">
        <TopicTrendsCard series={trend.topicVolumeSeries} />
        <div className="grid grid-cols-1 gap-4.5 @min-[700px]:grid-cols-2">
          <TopicMovementCard
            comparisonLabel={trend.comparisonLabel}
            icon={<TrendingUp className="text-[#1e55c5]" size={22} />}
            rows={trend.risingTopics}
            title="Rising Topics"
          />
          <TopicMovementCard
            comparisonLabel={trend.comparisonLabel}
            icon={<TrendingDown className="text-[#1e55c5]" size={22} />}
            rows={trend.decliningTopics}
            title="Declining Topics"
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-4.5">
        <SentimentTrendCard />
        <EmergingIssuesCard issues={trend.emergingIssues} />
        <TimelineCard events={trend.timelineEvents} />
      </div>
    </div>
  )
}
