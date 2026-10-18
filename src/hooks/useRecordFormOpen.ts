import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { recordFormOpen, type ApiForm, type ApiSharedForm } from '../api/forms'
import { queryKeys } from '../api/queries'

/**
 * Notes that the form was opened (editor or dashboard), once per form per visit, and
 * moves it up the cached lists' "Date opened" straight away — without refetching them,
 * which would re-seed the sidebar tree (see markWorkspaceStale).
 */
export function useRecordFormOpen(formId: number | null) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (formId === null) return
    const now = new Date().toISOString()
    queryClient.setQueryData<ApiForm[]>(queryKeys.forms, (forms) =>
      forms?.map((form) => (form.id === formId ? { ...form, lastOpenedAt: now } : form)),
    )
    queryClient.setQueryData<ApiSharedForm[]>(queryKeys.sharedForms, (forms) =>
      forms?.map((form) => (form.id === formId ? { ...form, lastOpenedAt: now } : form)),
    )
    // Only a sort hint: a failure isn't worth bothering anyone with.
    recordFormOpen(formId).catch(() => undefined)
  }, [formId, queryClient])
}
