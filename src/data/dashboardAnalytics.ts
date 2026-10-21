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
  /** Flagged as a violation by the AI pipeline. */
  violation?: boolean
  quote: string
  originalFeedback: string
  /** The response this came from (opens it in the Individual tab). Absent from older servers. */
  submissionId?: number
  submittedAt: string
  /** Who wrote it, when the form recorded names; null = anonymous. Absent from older servers. */
  respondentName?: string | null
  /**
   * Index into the topic's `volumeSeries` this point was counted in (null: outside every
   * bucket). Absent from servers older than the field.
   */
  volumeBucket?: number | null
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
  hasViolation?: boolean
  aiSummary: string
  keywords: TopicKeyword[]
  feedbackSegment: FeedbackPoint[]
  /**
   * Mentions per time bucket over the page's selected window + filters (4–8 points),
   * with their sentiment split (optional: absent from servers older than the split).
   */
  volumeSeries?: ({ label: string; value: number } & Partial<SentimentCounts>)[]
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
  /** Plain strings from servers older than recorded names. */
  responses: (string | TextResponse)[]
}

/** A free-text answer, with who wrote it when the form recorded names (null: anonymous). */
export type TextResponse = { text: string; respondentName: string | null }

export type DemographicBreakdown =
  | SingleChoiceBreakdown
  | MultiChoiceBreakdown
  | TextResponseBreakdown

export type TrendTopicSeries = {
  id: string
  label: string
}

/** How the topic picker ranks its list + which topics the chart auto-picks. */
export type TrendRank = 'mentioned' | 'violation'

/** One row of the Trend topic picker — every in-window topic, ranked. */
export type TrendAvailableTopic = {
  id: string
  label: string
  mentions: number
  violations: number
}

/** One "What changed" row: the latest complete period vs the one before it. */
export type WhatChangedRow = {
  id: string
  label: string
  /** null = no clear change; only listed for its violations. */
  kind: 'worse' | 'better' | 'new' | null
  /** Share of mentions moved ×/÷ 1.5 or more ("up" / "down") beyond chance. Missing from older API responses. */
  mentionsTrend?: 'up' | 'down' | null
  /** The topic's share of all mentions in each period (%). */
  share: { previous: number; current: number }
  /** Share of the topic's own mentions that were negative (%). */
  complaints: { previous: number; current: number }
  /** The counts behind `complaints`. Missing from older API responses. */
  complaintCounts?: { previous: { negative: number; total: number }; current: { negative: number; total: number } }
  /** Possible violations in the current period. */
  violations: number
  quote: string | null
}

export type WhatChanged = {
  currentLabel: string
  previousLabel: string
  /** The current period as [currentFrom, currentTo) ISO. Missing from older API responses. */
  currentFrom?: string
  currentTo?: string
  rows: WhatChangedRow[]
}

/** A date span the Themes feedback list can be narrowed to (from What changed). */
export type FeedbackDateRange = { label: string; from: string; to: string }

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
  /** Share of the period's mentions (%). */
  negative: number
  neutral: number
  positive: number
  /** Raw mention counts behind the percentages. Missing from older API responses. */
  counts?: SentimentCounts
}

/** Raw mention counts by sentiment (not percentages). */
export type SentimentCounts = {
  negative: number
  neutral: number
  positive: number
}

/** One charted topic over the whole selected window. */
export type TrendTopicSummary = SentimentCounts & {
  id: string
  mentions: number
}

export type FormTrendAnalytics = {
  bucket: TrendBucket
  /** How `availableTopics` is ordered + how the chart auto-picked lines. */
  rank: TrendRank
  /** The resolved window (ISO) — the auto default, or whatever the caller asked for. */
  from: string
  to: string
  rangeLabel: string
  /** Analysed mentions for this form across all time — "no data yet" vs "range too narrow". */
  totalMentions: number
  /** The lines currently on the chart. */
  topicVolumeSeries: TrendTopicSeries[]
  /** Every in-window topic, ranked — powers the topic picker. */
  availableTopics: TrendAvailableTopic[]
  volumeSeries: TrendVolumePoint[]
  /** Per charted topic id: sentiment counts per bucket, index-aligned with `volumeSeries`. */
  topicSentimentSeries: Record<string, SentimentCounts[]>
  /** Per charted topic: mentions + sentiment over the whole window. */
  topicSummaries: TrendTopicSummary[]
  sentimentSeries: TrendSentimentPoint[]
  /** null = the range doesn't hold two complete periods with feedback. Missing from older API responses. */
  whatChanged?: WhatChanged | null
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
  violationTopics: TopicSentiment[]
  aiDiscoveredTopics: TopicSentiment[]
  demographics: DemographicBreakdown[]
  feedbackResponses: DemographicBreakdown[]
  trend: FormTrendAnalytics
}

// Runtime mock data was removed once the Dashboard tabs moved to the live
// analytics API (see api/analytics.ts). These types are the shared contract.
