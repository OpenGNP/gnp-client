import { MessageCircle, Sparkles, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'

import type { TopicKeyword, TopicSentiment } from '../../data/dashboardAnalytics'
import { cn } from '../../lib/utils'
import { FeedbackSegmentSection } from './FeedbackSegmentSection'
import { SentimentGauge } from './SentimentGauge'
import { SENTIMENT_COLORS } from './sentimentColors'

function hashString(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0
  }
  return Math.abs(hash)
}

function seededRandom(seed: number) {
  let state = seed
  return () => {
    state = (state * 9301 + 49297) % 233280
    return state / 233280
  }
}

function buildTrend(topicId: string, baseline: number) {
  const random = seededRandom(hashString(topicId))
  let value = Math.max(8, baseline * 0.6)
  const points: { day: string; value: number }[] = []
  for (let day = 1; day <= 31; day += 1) {
    value = Math.min(100, Math.max(3, value + (random() - 0.42) * 10))
    points.push({ day: `Jan ${day}`, value: Math.round(value) })
  }
  return points
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
  onClose: () => void
  width: number | null
}

export function TopicDetailPanel({ topic, onClose, width }: TopicDetailPanelProps) {
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
  const sentimentScore = useMemo(() => {
    const total = feedbackPoints || 1
    return Math.round(((topic.positive * 5 + topic.neutral * 2.5) / total) * 10) / 10
  }, [feedbackPoints, topic.positive, topic.neutral])
  const trend = useMemo(
    () => buildTrend(topic.id, topic.percentOfTotal * 4),
    [topic.id, topic.percentOfTotal],
  )

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
          <div className="flex items-center gap-3">
            <SentimentGauge
              negative={topic.negative}
              neutral={topic.neutral}
              outOf={5}
              positive={topic.positive}
              score={sentimentScore}
            />
            <div className="flex flex-col gap-1.5 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span
                  className="size-1.75 shrink-0 rounded-full"
                  style={{ backgroundColor: SENTIMENT_COLORS.negative }}
                />
                <span className="text-[#929292]">
                  Negative:{' '}
                  <span className="text-[#14181f]">
                    {feedbackPoints ? Math.round((topic.negative / feedbackPoints) * 100) : 0}%
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
                    {feedbackPoints ? Math.round((topic.neutral / feedbackPoints) * 100) : 0}%
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
                    {feedbackPoints ? Math.round((topic.positive / feedbackPoints) * 100) : 0}%
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
        <p className="m-0 text-[12px] font-medium text-[#929292]">Topic Trends (by volume)</p>
        <div className="h-45 w-full">
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={trend} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid stroke="#f0f1f4" vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="day"
                interval={5}
                tick={{ fill: '#929292', fontSize: 11 }}
                tickLine={false}
              />
              <YAxis
                axisLine={false}
                domain={[0, 100]}
                tick={{ fill: '#929292', fontSize: 11 }}
                tickLine={false}
                ticks={[0, 25, 50, 75, 100]}
              />
              <Line
                dataKey="value"
                dot={false}
                isAnimationActive={false}
                stroke="#1e55c5"
                strokeWidth={2}
                type="monotone"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <FeedbackSegmentSection feedbackSegment={topic.feedbackSegment} />
    </aside>
  )
}
