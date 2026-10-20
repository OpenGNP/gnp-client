import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { formsQuery, sharedFormsQuery } from '../api/queries'
import { HeroGraphic } from '../components/dashboard/HeroGraphic'
import { FormCard } from '../components/forms/FormCard'
import { PageContainer } from '../components/layout/PageContainer'
import { FormCardGridSkeleton } from '../components/skeletons/FormCardSkeleton'
import { SkeletonRegion } from '../components/ui/skeleton'
import type { ProjectTreeItem } from '../data/dashboard'
import { ApiError } from '../lib/api'
import { showConfirm } from '../lib/alertDialog'
import { useAuth } from '../lib/auth'
import { formatRelativeTime } from '../lib/formatRelativeTime'
import { recency, recentTime } from '../lib/recentTime'
import { formPath } from '../lib/formPath'
import { placeholderFormImage } from '../lib/formCardImage'
import { findProjectById, formNodeId } from '../utils/projectTree'

function firstName(user: { fullName: string | null; email: string } | null): string {
  const source = user?.fullName?.trim() || user?.email || ''
  const [first] = source.split(/[\s@]+/)
  return first || 'there'
}

export type HomePageProps = {
  /** The sidebar's tree — the live names and which forms still exist, edits included. */
  projects: ProjectTreeItem[]
  onMoveItem: (id: string) => void
  onRenameItem: (id: string, name: string) => void
  onDeleteItem: (id: string) => void
}

export function HomePage({ projects, onMoveItem, onRenameItem, onDeleteItem }: HomePageProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  // The same `['forms']` query the sidebar tree is built from (dates, response counts);
  // names and deletions come from the tree, which holds edits not yet refetched.
  const formsResult = useQuery(formsQuery())
  // Forms shared with me join in once I've opened them — just being shared isn't "recent".
  const sharedResult = useQuery(sharedFormsQuery())
  const recentShared = (sharedResult.data ?? []).filter((form) => form.lastOpenedAt)
  const forms = [...(formsResult.data ?? [])]
    .flatMap((form) => {
      const node = findProjectById(projects, formNodeId(form.id))
      // Deleted here or in the sidebar, not refetched yet.
      if (projects.length > 0 && !node) return []
      return [{ ...form, formTitle: node?.label ?? form.formTitle }]
    })
    .sort((a, b) => recency(b) - recency(a))
  const recent = [
    ...forms.map((form) => ({ kind: 'own' as const, form, at: recency(form) })),
    ...recentShared.map((form) => ({ kind: 'shared' as const, form, at: Date.parse(form.lastOpenedAt ?? '') || 0 })),
  ].sort((a, b) => b.at - a.at)
  const errorMessage =
    formsResult.error instanceof ApiError
      ? formsResult.error.message
      : 'Something went wrong loading your forms.'

  // Delete / rename go through App's tree handlers — the same path as the sidebar and
  // Files page — so nothing here rewrites the `['forms']` cache (doing that re-seeds the
  // tree from data that may predate a drag just made in the sidebar).
  async function handleDeleteForm(id: number) {
    const node = findProjectById(projects, formNodeId(id))
    const target = forms.find((form) => form.id === id)
    const title = node?.label.trim() || target?.formTitle?.trim() || 'Untitled form'
    const responses = target?.submissionCount ?? 0
    // Collected responses can't be got back — losing them takes typing the form's name.
    const confirmed = await showConfirm({
      title: 'Delete form?',
      message: responses
        ? `“${title}” and its ${responses} response${responses === 1 ? '' : 's'} will be deleted. This can't be undone.`
        : `“${title}” will be deleted. This can't be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
      typeToConfirm: responses > 0 ? title : undefined,
    })
    if (confirmed) onDeleteItem(formNodeId(id))
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
              className="cursor-pointer rounded-[10px] border border-[#e0507a] px-3 py-1 text-[13px] font-medium text-[#e0507a] transition-colors hover:bg-[#fcf3f6]"
              onClick={() => void formsResult.refetch()}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : recent.length === 0 ? (
          <p className="mt-6.5 text-[14px] text-[#8b8e98]">
            No forms yet. Create your first form to get started.
          </p>
        ) : (
          <div className="mt-6.5 grid grid-cols-[repeat(auto-fit,minmax(min(235px,100%),235px))] gap-x-8 gap-y-5.25 max-[560px]:grid-cols-1">
            {recent.map((item) =>
              item.kind === 'own' ? (
                <FormCard
                  key={`own-${item.form.id}`}
                  image={placeholderFormImage(item.form.id)}
                  title={item.form.formTitle ?? 'Untitled form'}
                  timeLabel={recentTime(item.form).label}
                  updatedAt={formatRelativeTime(recentTime(item.form).at)}
                  onDelete={() => handleDeleteForm(item.form.id)}
                  onMove={() => onMoveItem(formNodeId(item.form.id))}
                  onOpen={() => navigate(formPath(item.form.urlId))}
                  onRename={(name) => onRenameItem(formNodeId(item.form.id), name)}
                />
              ) : (
                // Someone else's: view only, so it opens the dashboard and offers nothing else.
                <FormCard
                  badge="Shared"
                  key={`shared-${item.form.id}`}
                  image={placeholderFormImage(item.form.id)}
                  title={item.form.formTitle ?? 'Untitled form'}
                  // In Recent because I opened it, so that's the time it shows.
                  timeLabel="Opened"
                  updatedAt={formatRelativeTime(item.form.lastOpenedAt)}
                  onOpen={() => navigate(formPath(item.form.urlId, 'dashboard'))}
                />
              ),
            )}
          </div>
        )}
      </section>
    </PageContainer>
  )
}
