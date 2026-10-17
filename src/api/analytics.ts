import type {
  DemographicBreakdown,
  FormTrendAnalytics,
  TopicSentiment,
  TrendBucket,
  TrendRank,
} from '../data/dashboardAnalytics'
import { apiGet, httpClient } from '../lib/api'

/**
 * The viewer's IANA time zone (e.g. "Asia/Bangkok"). Sent with the themes/trend
 * requests so the server buckets by, and labels dates in, the viewer's own days.
 */
function viewerTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined
  } catch {
    return undefined
  }
}

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

/** A question as the Individual tab lists it; removed ones that still hold answers end in "(removed)". */
export type IndividualField = {
  id: number
  title: string
  section: 'demographic' | 'feedback'
  type: string
}

export type IndividualResponse = {
  id: number
  /** 1 = the first response ever submitted. */
  number: number
  submittedAt: string | null
  /** Only when the form recorded names. */
  respondentName: string | null
  /** fieldId → answers; several for multi-select, "Other: …" for an Other answer. */
  answers: Record<string, string[]>
}

export type FormIndividualResponses = { fields: IndividualField[]; responses: IndividualResponse[] }

/** Each submission's full answers, newest first — the Dashboard's Individual tab. */
export function getFormIndividualResponses(formId: number): Promise<FormIndividualResponses> {
  return apiGet<FormIndividualResponses>(`/analytics/forms/${formId}/individual`)
}

export type ResponseExportFormat = 'xlsx' | 'csv'

/** The form's raw responses as a file — one row per submission, one column per question. */
export async function downloadFormResponses(
  formId: number,
  format: ResponseExportFormat,
  includeNames: boolean,
): Promise<Blob> {
  const response = await httpClient.get<Blob>(`/forms/${formId}/export`, {
    params: { format, tz: viewerTimeZone(), names: includeNames ? undefined : 0 },
    responseType: 'blob',
  })
  return response.data
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
  /** Resolved analysis window (ISO) — echoes the caller's or the feedback-span default. */
  from: string
  to: string
  rangeLabel: string
  /** Analysed mentions across ALL time — distinguishes "none yet" from "none in range". */
  totalMentions: number
  totalResponders: number
  /** Responders in the window's last 7 days (filters applied); `responderDeltaLabel` words it. */
  responderDelta: number
  responderDeltaLabel: string
  /** One group per demographic question on the form — options come from all answers, so they stay put while filtering. */
  demographicFilters: { label: string; options: string[] }[]
  /** 0–5 score (see sentimentScore) plus raw feedback-point counts per sentiment. */
  sentiment: { score: number; outOf: number; negative: number; neutral: number; positive: number }
  violationTopics: TopicSentiment[]
  aiDiscoveredTopics: TopicSentiment[]
}

/** Adds the demographic filter as `demo` JSON, skipping questions with nothing chosen. */
function setDemoParam(params: URLSearchParams, demo: Record<string, string[]> | undefined) {
  const chosen = Object.fromEntries(Object.entries(demo ?? {}).filter(([, v]) => v.length > 0))
  if (Object.keys(chosen).length > 0) params.set('demo', JSON.stringify(chosen))
}

export type ThemeQuery = {
  from?: string
  to?: string
  /** Demographic question label → chosen answers; respondents must match every non-empty entry. */
  demo?: Record<string, string[]>
}

/** The Themes tab as xlsx (Summary, Topics, Feedback), under the same filters as `query`. */
export async function downloadFormThemes(
  formId: number,
  query: ThemeQuery,
  /** The topic order chosen on screen (TopicSortOption) — the file lists topics the same way. */
  sort: 'priority' | 'negative' | 'mentions' | 'positive',
  includeNames: boolean,
): Promise<Blob> {
  const params = new URLSearchParams()
  if (query.from) params.set('from', query.from)
  if (query.to) params.set('to', query.to)
  setDemoParam(params, query.demo)
  const tz = viewerTimeZone()
  if (tz) params.set('tz', tz)
  params.set('sort', sort)
  if (!includeNames) params.set('names', '0')
  const response = await httpClient.get<Blob>(`/analytics/forms/${formId}/themes/export?${params}`, {
    responseType: 'blob',
  })
  return response.data
}

export function getFormThemeAnalytics(
  formId: number,
  query: ThemeQuery = {},
): Promise<FormThemeAnalytics> {
  const params = new URLSearchParams()
  if (query.from) params.set('from', query.from)
  if (query.to) params.set('to', query.to)
  setDemoParam(params, query.demo)
  const tz = viewerTimeZone()
  if (tz) params.set('tz', tz)
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
  /** Same demographic filter as ThemeQuery.demo. */
  demo?: Record<string, string[]>
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
  setDemoParam(params, query.demo)
  const tz = viewerTimeZone()
  if (tz) params.set('tz', tz)
  const qs = params.toString()
  return apiGet<FormTrendAnalytics>(`/analytics/forms/${formId}/trend${qs ? `?${qs}` : ''}`)
}
