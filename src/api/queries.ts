import { keepPreviousData, queryOptions, type QueryClient } from '@tanstack/react-query'

import {
  getFormResponseAnalytics,
  getFormThemeAnalytics,
  getFormTrendAnalytics,
  type ThemeQuery,
  type TrendQuery,
} from './analytics'
import { listFolders } from './folders'
import { getForm, getPublicFormByToken, listForms } from './forms'

/** Every query key lives here so invalidation can't drift from the queries themselves. */
export const queryKeys = {
  forms: ['forms'] as const,
  folders: ['folders'] as const,
  form: (id: number) => ['form', id] as const,
  analytics: (id: number) => ['analytics', id] as const,
  responses: (id: number) => ['analytics', id, 'responses'] as const,
  themes: (id: number, query: ThemeQuery) => ['analytics', id, 'themes', query] as const,
  trend: (id: number, query: TrendQuery) => ['analytics', id, 'trend', query] as const,
  publicByToken: (token: string) => ['public-form', 'token', token] as const,
}

export const formsQuery = () => queryOptions({ queryKey: queryKeys.forms, queryFn: () => listForms() })

export const foldersQuery = () => queryOptions({ queryKey: queryKeys.folders, queryFn: listFolders })

export const formQuery = (id: number) =>
  queryOptions({ queryKey: queryKeys.form(id), queryFn: () => getForm(id) })

export const responsesQuery = (id: number) =>
  queryOptions({ queryKey: queryKeys.responses(id), queryFn: () => getFormResponseAnalytics(id) })

// Filtered views keep the previous result on screen while a new range / filter
// loads (`isPlaceholderData` drives the "Updating…" indicator).
export const themesQuery = (id: number, query: ThemeQuery) =>
  queryOptions({
    queryKey: queryKeys.themes(id, query),
    queryFn: () => getFormThemeAnalytics(id, query),
    placeholderData: keepPreviousData,
  })

export const trendQuery = (id: number, query: TrendQuery) =>
  queryOptions({
    queryKey: queryKeys.trend(id, query),
    queryFn: () => getFormTrendAnalytics(id, query),
    placeholderData: keepPreviousData,
  })

// Respondent views carry per-viewer state (`alreadyResponded`), so they're never
// served from cache: always fetched fresh, dropped as soon as the page unmounts.
export const publicFormByTokenQuery = (token: string) =>
  queryOptions({
    queryKey: queryKeys.publicByToken(token),
    queryFn: () => getPublicFormByToken(token),
    staleTime: 0,
    gcTime: 0,
  })

/**
 * After the sidebar/Files tree has already applied an edit locally: mark the
 * workspace lists stale without refetching them now (a refetch would re-seed the
 * tree, dropping client-only state like folder-in-folder nesting). The next page
 * that mounts them — e.g. Home — fetches fresh.
 */
export function markWorkspaceStale(client: QueryClient, formId?: number) {
  void client.invalidateQueries({ queryKey: queryKeys.forms, refetchType: 'none' })
  void client.invalidateQueries({ queryKey: queryKeys.folders, refetchType: 'none' })
  if (formId !== undefined) {
    void client.invalidateQueries({ queryKey: queryKeys.form(formId), refetchType: 'none' })
  }
}
