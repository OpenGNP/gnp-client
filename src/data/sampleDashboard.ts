import type { FormIndividualResponses, FormResponseAnalytics, FormThemeAnalytics } from '../api/analytics'
import type { FormTrendAnalytics } from './dashboardAnalytics'
import { individual, responses, themes, trend } from './demoSnapshot.json'

/* The empty-form tour's preview: the /demo form's real AI results (demoSnapshot.json, from
   gnp-server `bun run demo:snapshot`), the same data the landing page shows. */

export const SAMPLE_THEMES = themes as unknown as FormThemeAnalytics
export const SAMPLE_TREND = trend as unknown as FormTrendAnalytics
export const SAMPLE_RESPONSES = responses as unknown as FormResponseAnalytics
export const SAMPLE_INDIVIDUAL = individual as unknown as FormIndividualResponses
