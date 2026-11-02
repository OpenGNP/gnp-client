import { useQuery } from '@tanstack/react-query'
import { useContext, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { formRefQuery } from '../api/queries'
import { DEMO_FORM_ID, DemoContext } from '../lib/demo'

/**
 * The form a `/forms/:projectId` route points at. The URL carries the form's `urlId`;
 * this resolves it to the numeric id the API calls use (instant when the sidebar's
 * form list already seeded the cache — see useWorkspaceTree). A legacy numeric URL
 * resolves too, and is swapped for its urlId form in place.
 */
export function useRouteForm() {
  // /demo has no :projectId: it's always the demo form, which the visitor "owns".
  const demo = useContext(DemoContext)
  const { projectId: ref = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const result = useQuery({ ...formRefQuery(ref), enabled: ref !== '' && !demo })
  const resolved = result.data

  useEffect(() => {
    if (!resolved || resolved.urlId === ref) return
    const prefix = `/forms/${encodeURIComponent(ref)}`
    if (!location.pathname.startsWith(prefix)) return
    const rest = location.pathname.slice(prefix.length)
    navigate(`/forms/${encodeURIComponent(resolved.urlId)}${rest}${location.search}`, { replace: true })
  }, [resolved, ref, location.pathname, location.search, navigate])

  if (demo) {
    return { formId: DEMO_FORM_ID, role: 'owner' as const, status: 'ready' as const, error: null, retry: () => {} }
  }
  return {
    formId: resolved?.id ?? null,
    // The sidebar seeds its own forms without a role — those are always the owner's.
    role: resolved?.role ?? ('owner' as const),
    status: ref === '' || result.isError ? ('error' as const) : resolved ? ('ready' as const) : ('loading' as const),
    error: result.error,
    retry: () => void result.refetch(),
  }
}
