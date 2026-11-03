import type { FormThemeAnalytics } from '../api/analytics'
import { sortTopics } from '../components/dashboard/topicSort'
import { needsReview } from '../components/dashboard/violationReview'
import type { FeedbackPoint, FormTrendAnalytics, WhatChanged } from './dashboardAnalytics'
import { responses, themes as rawThemes, trend as rawTrend } from './demoSnapshot.json'

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
  comments: { text: string; topicId: string; violation?: boolean }[]
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
// A topic's best quotes: flagged ones, then ones long enough to say something ("Easy." doesn't).
// The AI's third-person retellings ("User asked …") read worse than the respondent's own words.
const score = (point: FeedbackPoint) =>
  (point.violation ? 2 : 0) + (point.quote.split(/\s+/).length >= 6 ? 1 : 0) - (/^User /.test(point.quote) ? 1 : 0)
const bestQuotes = topics.map((topic) => [...topic.feedbackSegment].sort((a, b) => score(b) - score(a)))
const comments = Array.from({ length: QUOTES_PER_TOPIC }, (_, i) =>
  topics.flatMap((topic, t) => {
    const point = bestQuotes[t]![i]
    return point ? [{ text: point.quote, topicId: topic.id, violation: point.violation }] : []
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
