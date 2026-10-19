import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { recordFormOpen, type ApiSharedForm } from '../api/forms'
import { queryKeys } from '../api/queries'

/**
 * Notes that the form was opened (editor or dashboard), once per form per visit.
 *
 * The `['forms']` cache is only marked stale, never rewritten: the sidebar tree is
 * built from it, and rewriting it re-seeds the tree from data that may predate local
 * edits (a form just dragged into a folder would jump back). The next page that
 * mounts it (e.g. Home) refetches, with the new "Date opened" in it.
 */
export function useRecordFormOpen(formId: number | null) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (formId === null) return
    // Not a tree source, so this one can move up right away.
    const now = new Date().toISOString()
    queryClient.setQueryData<ApiSharedForm[]>(queryKeys.sharedForms, (forms) =>
      forms?.map((form) => (form.id === formId ? { ...form, lastOpenedAt: now } : form)),
    )
    recordFormOpen(formId)
      .then(() => queryClient.invalidateQueries({ queryKey: queryKeys.forms, exact: true, refetchType: 'none' }))
      // Only a sort hint: a failure isn't worth bothering anyone with.
      .catch(() => undefined)
  }, [formId, queryClient])
}
