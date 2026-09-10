import type {
  DemographicBreakdown,
  FormTrendAnalytics,
  TopicSentiment,
  TrendBucket,
  TrendRank,
} from '../data/dashboardAnalytics'
import { apiGet } from '../lib/api'

/**
 * Per-field answer breakdown for one form — the Dashboard's Response tab.
 * `demographic` / `feedback` split by the field's `section`; each entry is a
 * `single-choice` (pie), `multi-choice` (bar) or `text` (response list) breakdown,
 * the same union the mock dashboard data uses.
 */
export type FormResponseAnalytics = {
  totalResponses: number
  demographic: DemographicBreakdown[]
  feedback: DemographicBreakdown[]
}

export function getFormResponseAnalytics(formId: number): Promise<FormResponseAnalytics> {
  return apiGet<FormResponseAnalytics>(`/analytics/forms/${formId}/responses`)
}

/**
 * Topic / sentiment analysis for one form — the Dashboard's Themes tab. Topics come
 * from the AI pipeline's canonical topics; `feedbackSegment` samples are tagged with
 * the respondent's demographic answers. Same `TopicSentiment` shape the mock used.
 */
export type FormThemeAnalytics = {
  title: string
  /** Resolved analysis window (ISO) — echoes the caller's or the feedback-span default. */
  from: string
  to: string
  rangeLabel: string
  /** Analysed mentions across ALL time — distinguishes "none yet" from "none in range". */
  totalMentions: number
  totalResponders: number
  responderDeltaLabel: string
  sentiment: { score: number; outOf: number; negative: number; neutral: number; positive: number }
  highIntenseTopics: TopicSentiment[]
  aiDiscoveredTopics: TopicSentiment[]
}

export type ThemeQuery = { from?: string; to?: string }

export function getFormThemeAnalytics(
  formId: number,
  query: ThemeQuery = {},
): Promise<FormThemeAnalytics> {
  const params = new URLSearchParams()
  if (query.from) params.set('from', query.from)
  if (query.to) params.set('to', query.to)
  const qs = params.toString()
  return apiGet<FormThemeAnalytics>(`/analytics/forms/${formId}/themes${qs ? `?${qs}` : ''}`)
}

/**
 * Trend over a chosen window + bucket granularity (day/week/month/year) for one form.
 * Real time series (`volumeSeries` / `sentimentSeries`) plus Rising/Declining vs the
 * previous equal-length window. `from`/`to` are ISO date strings.
 */
export type TrendQuery = {
  from?: string
  to?: string
  bucket?: TrendBucket
  /** Orders `availableTopics` + auto-picks lines when `topics` is omitted. */
  rank?: TrendRank
  /** Explicit topic ids to chart (max 8). Omit to let the server pick by `rank`. */
  topics?: string[]
}

export function getFormTrendAnalytics(
  formId: number,
  query: TrendQuery = {},
): Promise<FormTrendAnalytics> {
  const params = new URLSearchParams()
  if (query.from) params.set('from', query.from)
  if (query.to) params.set('to', query.to)
  if (query.bucket) params.set('bucket', query.bucket)
  if (query.rank) params.set('rank', query.rank)
  if (query.topics && query.topics.length > 0) params.set('topics', query.topics.join(','))
  const qs = params.toString()
  return apiGet<FormTrendAnalytics>(`/analytics/forms/${formId}/trend${qs ? `?${qs}` : ''}`)
}
