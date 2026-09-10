export type TopicKeyword = {
  text: string
  weight: 1 | 2 | 3
}

export type FeedbackSentiment = 'negative' | 'neutral' | 'positive'

/** One of the respondent's demographic answers — label + value straight from the form. */
export type FeedbackDemographic = {
  label: string
  value: string
}

export type FeedbackPoint = {
  id: string
  sentiment: FeedbackSentiment
  quote: string
  originalFeedback: string
  submittedAt: string
  /**
   * The respondent's answers to whatever demographic (single-choice) questions the
   * form has — could be Year / Department / Gender / Age / anything. In form order.
   */
  demographics: FeedbackDemographic[]
}

export type TopicSentiment = {
  id: string
  label: string
  negative: number
  neutral: number
  positive: number
  percentOfTotal: number
  isHighIntensity?: boolean
  aiSummary: string
  keywords: TopicKeyword[]
  feedbackSegment: FeedbackPoint[]
}

export type DemographicOption = {
  id: string
  label: string
  value: number
}

export type SingleChoiceBreakdown = {
  kind: 'single-choice'
  id: string
  title: string
  options: DemographicOption[]
}

export type MultiChoiceBreakdown = {
  kind: 'multi-choice'
  id: string
  title: string
  totalRespondents: number
  options: DemographicOption[]
}

export type TextResponseBreakdown = {
  kind: 'text'
  id: string
  title: string
  responses: string[]
}

export type DemographicBreakdown =
  | SingleChoiceBreakdown
  | MultiChoiceBreakdown
  | TextResponseBreakdown

export type TrendTopicSeries = {
  id: string
  label: string
}

export type TopicMovement = {
  id: string
  label: string
  volumeChange: number
  positiveChange: number
  negativeChange: number
}

export type EmergingIssue = {
  id: string
  title: string
  description: string
  riskLabel: string
}

export type TrendTimelineEvent = {
  id: string
  date: string
  description: string
  change: number
  metricLabel: string
}

export type FormTrendAnalytics = {
  rangeLabel: string
  comparisonLabel: string
  topicVolumeSeries: TrendTopicSeries[]
  risingTopics: TopicMovement[]
  decliningTopics: TopicMovement[]
  emergingIssues: EmergingIssue[]
  timelineEvents: TrendTimelineEvent[]
}

export type FormDashboardAnalytics = {
  formId: string
  status: 'Active' | 'Closed'
  openDateRangeLabel: string
  lastUpdatedLabel: string
  title: string
  totalResponders: number
  responderDeltaLabel: string
  sentiment: {
    score: number
    outOf: number
    negative: number
    neutral: number
    positive: number
  }
  highIntenseTopics: TopicSentiment[]
  aiDiscoveredTopics: TopicSentiment[]
  demographics: DemographicBreakdown[]
  feedbackResponses: DemographicBreakdown[]
  trend: FormTrendAnalytics
}

// Runtime mock data was removed once the Dashboard tabs moved to the live
// analytics API (see api/analytics.ts). These types are the shared contract.
