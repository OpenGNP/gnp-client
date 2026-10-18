import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { sharedFormsQuery } from '../api/queries'
import { FormCard } from '../components/forms/FormCard'
import { PageContainer } from '../components/layout/PageContainer'
import { FormCardGridSkeleton } from '../components/skeletons/FormCardSkeleton'
import { SkeletonRegion } from '../components/ui/skeleton'
import { formatRelativeTime } from '../lib/formatRelativeTime'
import { formPath } from '../lib/formPath'
import { placeholderFormImage } from '../lib/formCardImage'

/** Forms other people shared with me to view — each opens straight to its dashboard. */
export function SharedPage() {
  const navigate = useNavigate()
  const shared = useQuery(sharedFormsQuery())

  return (
    <PageContainer>
      <h1 className="m-0 pt-8 text-[22px] font-normal text-[#3c4043]">Shared with me</h1>
      <p className="m-0 mt-1 text-[13px] text-[#726f6f]">Dashboards others have shared with you. View only.</p>

      {shared.isPending ? (
        <SkeletonRegion className="mt-6.5" label="Loading shared forms…">
          <FormCardGridSkeleton />
        </SkeletonRegion>
      ) : shared.isError ? (
        <div className="mt-6.5 flex flex-wrap items-center gap-3 text-[14px] text-[#e0507a]">
          <span>Could not load shared forms.</span>
          <button
            className="cursor-pointer rounded-[5px] border border-[#e0507a] px-3 py-1 text-[13px] font-medium text-[#e0507a] transition-colors hover:bg-[#fcf3f6]"
            onClick={() => void shared.refetch()}
            type="button"
          >
            Try again
          </button>
        </div>
      ) : shared.data.length === 0 ? (
        <p className="mt-6.5 text-[14px] text-[#8b8e98]">Nothing has been shared with you yet.</p>
      ) : (
        <div className="mt-6.5 grid grid-cols-[repeat(auto-fit,minmax(min(235px,100%),235px))] gap-x-8 gap-y-5.25 max-[560px]:grid-cols-1">
          {shared.data.map((form) => (
            <div className="flex flex-col gap-1.5" key={form.id}>
              <FormCard
                image={placeholderFormImage(form.id)}
                onOpen={() => navigate(formPath(form.urlId, 'dashboard'))}
                title={form.formTitle ?? 'Untitled form'}
                updatedAt={form.updatedAt ? formatRelativeTime(form.updatedAt) : '—'}
              />
              {form.ownerName ? (
                <p className="m-0 truncate px-1 text-[12px] text-[#8b8e98]">Shared by {form.ownerName}</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  )
}
