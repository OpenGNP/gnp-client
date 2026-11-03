import type { FormThemeAnalytics } from '../api/analytics'
import { sortTopics } from '../components/dashboard/topicSort'
import { needsReview } from '../components/dashboard/violationReview'
import type { FeedbackPoint, FormTrendAnalytics, WhatChanged } from './dashboardAnalytics'
import { responses, themes as rawThemes, trend as rawTrend } from './demoSnapshot.json'

/* The /demo form's real AI results (demoSnapshot.json, from gnp-server `bun run demo:snapshot`). */

const themes = rawThemes as unknown as FormThemeAnalytics
const trend = rawTrend as unknown as FormTrendAnalytics

export type LandingTopic = {
  id: string
  label: string
  negative: number
  neutral: number
  positive: number
  percentOfTotal: number
  hasViolation?: boolean
}

export type LandingSample = {
  /** The sample form's name, as the dashboard heads it. */
  formTitle: string
  responseCount: number
  /** Answers with the topic the AI filed them under, taking turns across topics so the first few differ. */
  comments: { text: string; topicId: string }[]
  topics: LandingTopic[]
  whatChanged: WhatChanged
  flaggedTopic: string
  flaggedPoint: FeedbackPoint
  /** Flagged mentions across every topic, and those still to confirm or dismiss, as the dashboard counts them. */
  violationMentions: number
  reviewCount: number
  /** The AI's one-line summary per topic, shown when a topic is opened. */
  topicSummaries: Record<string, string>
}

const QUOTES_PER_TOPIC = 3

// In the dashboard's default Priority order.
const topics = sortTopics(themes.aiDiscoveredTopics, 'priority')
const points = topics.flatMap((topic) => topic.feedbackSegment)
// Flagged answers first, so the violation is what a visitor sees under its topic.
const quotesOf = (topic: (typeof topics)[number]) =>
  [...topic.feedbackSegment].sort((a, b) => Number(Boolean(b.violation)) - Number(Boolean(a.violation)))
const comments = Array.from({ length: QUOTES_PER_TOPIC }, (_, i) =>
  topics.flatMap((topic) => {
    const point = quotesOf(topic)[i]
    return point ? [{ text: point.quote, topicId: topic.id }] : []
  }),
).flat()

const flaggedTopic = themes.violationTopics.find((topic) => topic.feedbackSegment.some((point) => point.violation))!

/** Real results for the signed-out landing page, shown under a "Sample data" label. */
export const LANDING_SAMPLES: Record<'workplace', LandingSample> = {
  workplace: {
    formTitle: 'Staff pulse survey',
    responseCount: responses.totalResponses,
    comments,
    topics: topics.map(({ id, label, negative, neutral, positive, percentOfTotal, hasViolation }) => ({
      id,
      label,
      negative,
      neutral,
      positive,
      percentOfTotal,
      hasViolation,
    })),
    whatChanged: trend.whatChanged!,
    flaggedTopic: flaggedTopic.label,
    flaggedPoint: flaggedTopic.feedbackSegment.find((point) => point.violation)!,
    violationMentions: points.filter((point) => point.violation).length,
    // Shown as if the owner already confirmed the rest: one left reads as a task, not a backlog.
    reviewCount: Math.min(1, points.filter(needsReview).length),
    topicSummaries: Object.fromEntries(topics.map((topic) => [topic.id, topic.aiSummary])),
  },
}
