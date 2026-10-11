import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { deleteForm, updateForm, type ApiForm } from '../api/forms'
import { formsQuery, queryKeys } from '../api/queries'
import { HeroGraphic } from '../components/dashboard/HeroGraphic'
import { FormCard } from '../components/forms/FormCard'
import { PageContainer } from '../components/layout/PageContainer'
import { FormCardGridSkeleton } from '../components/skeletons/FormCardSkeleton'
import { SkeletonRegion } from '../components/ui/skeleton'
import { ApiError } from '../lib/api'
import { useAuth } from '../lib/auth'
import { formatRelativeTime } from '../lib/formatRelativeTime'
import { placeholderFormImage } from '../lib/formCardImage'
import { formNodeId } from '../utils/projectTree'

function firstName(user: { fullName: string | null; email: string } | null): string {
  const source = user?.fullName?.trim() || user?.email || ''
  const [first] = source.split(/[\s@]+/)
  return first || 'there'
}

export type HomePageProps = {
  onMoveItem: (id: string) => void
}

export function HomePage({ onMoveItem }: HomePageProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  // The same `['forms']` query the sidebar tree uses — one request feeds both, and
  // the optimistic edits below (written to that cache) show in the sidebar too.
  const formsResult = useQuery(formsQuery())
  const forms = formsResult.data ?? []
  const errorMessage =
    formsResult.error instanceof ApiError
      ? formsResult.error.message
      : 'Something went wrong loading your forms.'

  /** Optimistically rewrites the cached list; returns the snapshot to roll back to. */
  function updateCachedForms(transform: (current: ApiForm[]) => ApiForm[]) {
    const snapshot = queryClient.getQueryData<ApiForm[]>(queryKeys.forms)
    queryClient.setQueryData<ApiForm[]>(queryKeys.forms, (current) => transform(current ?? []))
    return snapshot
  }

  function settleForms(formId: number) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.forms })
    void queryClient.invalidateQueries({ queryKey: queryKeys.form(formId) })
  }

  async function handleDeleteForm(id: number) {
    const target = forms.find((form) => form.id === id)
    if (!window.confirm(`Delete "${target?.formTitle ?? 'this form'}"? This can't be undone.`)) {
      return
    }

    const snapshot = updateCachedForms((current) => current.filter((form) => form.id !== id))
    try {
      await deleteForm(id)
      queryClient.removeQueries({ queryKey: queryKeys.form(id) })
      queryClient.removeQueries({ queryKey: queryKeys.analytics(id) })
    } catch (error) {
      queryClient.setQueryData(queryKeys.forms, snapshot)
      window.alert(error instanceof ApiError ? error.message : 'Could not delete the form.')
    } finally {
      void queryClient.invalidateQueries({ queryKey: queryKeys.forms })
    }
  }

  // Like handleDeleteForm: optimistic write to the shared `['forms']` cache (so the
  // sidebar tree shows the new name immediately), persist, roll back on failure.
  async function handleRenameForm(id: number, label: string) {
    const trimmed = label.trim()
    if (!trimmed) {
      return
    }

    const target = forms.find((form) => form.id === id)
    const clashesInSameFolder = forms.some(
      (form) =>
        form.id !== id &&
        form.folderId === (target?.folderId ?? null) &&
        (form.formTitle ?? '').trim().toLowerCase() === trimmed.toLowerCase(),
    )
    if (clashesInSameFolder && trimmed.toLowerCase() !== (target?.formTitle ?? '').trim().toLowerCase()) {
      window.alert(`A form named “${trimmed}” already exists in this location.`)
      return
    }

    const snapshot = updateCachedForms((current) =>
      current.map((form) => (form.id === id ? { ...form, formTitle: trimmed } : form)),
    )
    try {
      await updateForm(id, { formTitle: trimmed })
    } catch (error) {
      queryClient.setQueryData(queryKeys.forms, snapshot)
      window.alert(error instanceof ApiError ? error.message : 'Could not rename the form.')
    } finally {
      settleForms(id)
    }
  }

  return (
    <PageContainer>
      <section className="grid h-65.5 grid-cols-[minmax(320px,419px)_minmax(420px,562px)] items-center gap-14.25 max-[1200px]:h-auto max-[1200px]:grid-cols-1 max-[1200px]:gap-6 max-[1200px]:py-12 max-[1200px]:pb-7 max-[560px]:py-8">
        <div className="pt-10 max-[1200px]:pt-0">
          <h1 className="m-0 mb-5.25 text-[32px] leading-[1.12] font-semibold tracking-[0.32px] text-black max-[560px]:text-[28px]">
            Welcome back, {firstName(user)}!
          </h1>
          <p className="m-0 text-[16px] leading-[25.376px] font-normal tracking-[0.16px] text-black">
            Manage your feedback and view AI-powered analytics
          </p>
        </div>
        <HeroGraphic />
      </section>

      <section className="pt-4" aria-labelledby="recent-title">
        <h2
          className="m-0 text-[16px] leading-[25.376px] font-normal tracking-[0.16px] text-black"
          id="recent-title"
        >
          Recent forms
        </h2>

        {formsResult.isPending ? (
          <SkeletonRegion className="mt-6.5" label="Loading your forms…">
            <FormCardGridSkeleton />
          </SkeletonRegion>
        ) : formsResult.isError ? (
          <div className="mt-6.5 flex flex-wrap items-center gap-3 text-[14px] text-[#e0507a]">
            <span>{errorMessage}</span>
            <button
              className="cursor-pointer rounded-[5px] border border-[#e0507a] px-3 py-1 text-[13px] font-medium text-[#e0507a] transition-colors hover:bg-[#fcf3f6]"
              onClick={() => void formsResult.refetch()}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : forms.length === 0 ? (
          <p className="mt-6.5 text-[14px] text-[#8b8e98]">
            No forms yet. Create your first form to get started.
          </p>
        ) : (
          <div className="mt-6.5 grid grid-cols-[repeat(auto-fit,minmax(min(235px,100%),235px))] gap-x-8 gap-y-5.25 max-[560px]:grid-cols-1">
            {forms.map((form) => (
              <FormCard
                key={form.id}
                image={placeholderFormImage(form.id)}
                title={form.formTitle ?? 'Untitled form'}
                updatedAt={formatRelativeTime(form.updatedAt ?? form.createdAt)}
                onDelete={() => handleDeleteForm(form.id)}
                onMove={() => onMoveItem(formNodeId(form.id))}
                onOpen={() => navigate(`/forms/${form.id}`)}
                onRename={(name) => handleRenameForm(form.id, name)}
              />
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  )
}
