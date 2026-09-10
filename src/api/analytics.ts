import type {
  DemographicBreakdown,
  FormTrendAnalytics,
  TopicSentiment,
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
  totalResponders: number
  responderDeltaLabel: string
  sentiment: { score: number; outOf: number; negative: number; neutral: number; positive: number }
  highIntenseTopics: TopicSentiment[]
  aiDiscoveredTopics: TopicSentiment[]
}

export function getFormThemeAnalytics(formId: number): Promise<FormThemeAnalytics> {
  return apiGet<FormThemeAnalytics>(`/analytics/forms/${formId}/themes`)
}

/**
 * Topic movement over time for one form — the Dashboard's Trend tab. Compares the two
 * halves of the form's feedback window (Rising/Declining tables, Emerging Issues,
 * Timeline); the two line charts in `TrendView` stay client-synthetic.
 */
export function getFormTrendAnalytics(formId: number): Promise<FormTrendAnalytics> {
  return apiGet<FormTrendAnalytics>(`/analytics/forms/${formId}/trend`)
}
