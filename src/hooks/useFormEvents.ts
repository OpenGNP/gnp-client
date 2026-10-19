import { useQueryClient, type QueryKey } from '@tanstack/react-query'
import { useEffect } from 'react'

import { queryKeys } from '../api/queries'
import { API_URL } from '../lib/api'

type FormEventKind = 'response' | 'analysis' | 'form'

const BATCH_MS = 1500
const FALLBACK_POLL_MS = 60_000

/** What each server event makes stale. */
function keysFor(formId: number, kind: FormEventKind): QueryKey[] {
  switch (kind) {
    // A new response also changes the Themes "pending analysis" count.
    case 'response':
      return [queryKeys.responses(formId), queryKeys.individual(formId), ['analytics', formId, 'themes']]
    case 'analysis':
      return [['analytics', formId, 'themes'], ['analytics', formId, 'trend']]
    case 'form':
      return [queryKeys.form(formId)]
  }
}

/**
 * Keeps a form's dashboard live: the server pushes "this changed" (SSE, from Postgres
 * NOTIFY — see gnp-server lib/formEvents.ts) and the matching queries refetch, keeping
 * what's on screen until the new data lands. Bursts (many responses at once) refetch
 * once. While the stream is down (proxy without SSE, network), it polls every minute.
 */
export function useFormEvents(formId: number | null) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (formId === null) return

    const pending = new Set<FormEventKind>()
    let flushTimer: ReturnType<typeof setTimeout> | undefined
    const flush = () => {
      flushTimer = undefined
      for (const kind of pending) {
        for (const queryKey of keysFor(formId, kind)) void queryClient.invalidateQueries({ queryKey })
      }
      pending.clear()
    }
    const queue = (kind: FormEventKind) => {
      pending.add(kind)
      flushTimer ??= setTimeout(flush, BATCH_MS)
    }

    // The auth cookie rides along (EventSource can't send an Authorization header).
    // No EventSource at all (old browser, tests): polling alone.
    const source =
      typeof EventSource === 'undefined'
        ? null
        : new EventSource(`${API_URL}/forms/${formId}/events`, { withCredentials: true })
    for (const kind of ['response', 'analysis', 'form'] as const) {
      source?.addEventListener(kind, () => queue(kind))
    }

    const refetchAll = () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.analytics(formId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.form(formId) })
    }

    // Back after a drop: events sent meanwhile are gone (SSE here doesn't replay), so
    // catch up once now rather than waiting for the next poll. Not on the first open the page has only just loaded its data.
    let hasOpened = false
    source?.addEventListener('open', () => {
      if (hasOpened) refetchAll()
      hasOpened = true
    })

    const poll = setInterval(() => {
      if (source?.readyState === EventSource.OPEN) return
      refetchAll()
    }, FALLBACK_POLL_MS)

    return () => {
      source?.close()
      clearInterval(poll)
      if (flushTimer) clearTimeout(flushTimer)
    }
  }, [formId, queryClient])
}
