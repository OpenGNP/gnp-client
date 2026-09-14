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
  /** Flagged by the AI pipeline as reporting a legal, ethical or moral breach. */
  severe?: boolean
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

/** How the topic picker ranks its list + which topics the chart auto-picks. */
export type TrendRank = 'mentioned' | 'severe'

/** One row of the Trend topic picker — every in-window topic, ranked. */
export type TrendAvailableTopic = {
  id: string
  label: string
  mentions: number
  severe: number
}

export type TopicMovementStatus = 'existing' | 'new' | 'inactive'

export type TopicMovement = {
  id: string
  label: string
  currentMentions: number
  /** This topic's average mentions per bucket, over its history up to (not
   *  including) the latest bucket — NOT just the single bucket right before it. */
  previousMentions: number
  /** Cumulative mentions across ALL topics up to the latest bucket — same value on
   *  every row. */
  previousTotalMentions: number
  /** currentMentions − previousMentions, rounded. The PRIMARY signal — this is what
   *  ranks and labels rising/declining, not changePercent (dividing by a tiny/
   *  fractional average produces meaningless numbers like "+1900%"). */
  delta: number
  /** Secondary context only (e.g. a tooltip) — never used for ranking/display as
   *  the primary indicator. `null` when there's no baseline (status "new" or
   *  "inactive") or the baseline is too small for a percentage to mean anything. */
  changePercent: number | null
  status: TopicMovementStatus
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

export type TrendBucket = 'day' | 'week' | 'month' | 'year'

/** One x-axis point of the volume chart: `{ label, [topicId]: count }`. */
export type TrendVolumePoint = Record<string, number | string>

export type TrendSentimentPoint = {
  label: string
  negative: number
  neutral: number
  positive: number
}

export type FormTrendAnalytics = {
  bucket: TrendBucket
  /** How `availableTopics` is ordered + how the chart auto-picked lines. */
  rank: TrendRank
  /** The resolved window (ISO) — the auto default, or whatever the caller asked for. */
  from: string
  to: string
  rangeLabel: string
  comparisonLabel: string
  /** Analysed mentions for this form across all time — "no data yet" vs "range too narrow". */
  totalMentions: number
  /** The lines currently on the chart. */
  topicVolumeSeries: TrendTopicSeries[]
  /** Every in-window topic, ranked — powers the topic picker. */
  availableTopics: TrendAvailableTopic[]
  volumeSeries: TrendVolumePoint[]
  sentimentSeries: TrendSentimentPoint[]
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
