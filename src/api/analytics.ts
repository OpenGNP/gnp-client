import type { DemographicBreakdown } from '../data/dashboardAnalytics'
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
