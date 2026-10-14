import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { formRefQuery } from '../api/queries'

/**
 * The form a `/forms/:projectId` route points at. The URL carries the form's `urlId`;
 * this resolves it to the numeric id the API calls use (instant when the sidebar's
 * form list already seeded the cache — see useWorkspaceTree). A legacy numeric URL
 * resolves too, and is swapped for its urlId form in place.
 */
export function useRouteForm() {
  const { projectId: ref = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const result = useQuery({ ...formRefQuery(ref), enabled: ref !== '' })
  const resolved = result.data

  useEffect(() => {
    if (!resolved || resolved.urlId === ref) return
    const prefix = `/forms/${encodeURIComponent(ref)}`
    if (!location.pathname.startsWith(prefix)) return
    const rest = location.pathname.slice(prefix.length)
    navigate(`/forms/${encodeURIComponent(resolved.urlId)}${rest}${location.search}`, { replace: true })
  }, [resolved, ref, location.pathname, location.search, navigate])

  return {
    formId: resolved?.id ?? null,
    status: ref === '' || result.isError ? ('error' as const) : resolved ? ('ready' as const) : ('loading' as const),
    error: result.error,
    retry: () => void result.refetch(),
  }
}
