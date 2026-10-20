import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { ApiSharedForm } from '../api/forms'
import { sharedFormsQuery } from '../api/queries'
import { SortControls } from '../components/files/SortControls'
import { DEFAULT_SORT_DIR, type SortDir, type SortKey } from '../components/files/sortOptions'
import { FormCard } from '../components/forms/FormCard'
import { PageContainer } from '../components/layout/PageContainer'
import { FormCardGridSkeleton } from '../components/skeletons/FormCardSkeleton'
import { SkeletonRegion } from '../components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip'
import { formatRelativeTime } from '../lib/formatRelativeTime'
import { formPath } from '../lib/formPath'
import { placeholderFormImage } from '../lib/formCardImage'

function sortShared(forms: ApiSharedForm[], sortKey: SortKey, sortDir: SortDir) {
  const flip = sortDir === 'asc' ? 1 : -1
  const byName = (a: ApiSharedForm, b: ApiSharedForm) =>
    (a.formTitle ?? '').localeCompare(b.formTitle ?? '', undefined, { numeric: true, sensitivity: 'base' })
  // Never opened yet → when it was shared, so a new share isn't buried at the bottom.
  const time = (form: ApiSharedForm) =>
    Date.parse((sortKey === 'opened' ? (form.lastOpenedAt ?? form.sharedAt) : form.updatedAt) ?? '') || 0
  return [...forms].sort((a, b) =>
    sortKey === 'name' ? flip * byName(a, b) : flip * (time(a) - time(b)) || byName(a, b),
  )
}

/** The time a card shows — the one the list is sorted by. Never opened → when it was shared. */
function cardTime(form: ApiSharedForm, sortKey: SortKey): { label: string; at: string | null } {
  if (sortKey === 'opened') {
    return form.lastOpenedAt ? { label: 'Opened', at: form.lastOpenedAt } : { label: 'Shared', at: form.sharedAt }
  }
  return { label: 'Modified', at: form.updatedAt }
}

/** Forms other people shared with me to view — laid out like the Files page; each opens its dashboard. */
export function SharedPage() {
  const navigate = useNavigate()
  const shared = useQuery(sharedFormsQuery())
  const [sortKey, setSortKey] = useState<SortKey>('opened')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  return (
    <div className="min-h-[calc(100vh-50px)] min-[900px]:min-h-screen">
      <PageContainer>
        {/* Same title row as the Files page: title left, Sort at the end. */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-8 pb-1">
          <h1 className="m-0 px-1.5 py-1 text-[22px] font-semibold text-[#3c4043]">Shared with me</h1>
          <SortControls
            keys={['name', 'opened', 'modified']}
            onSortDirChange={setSortDir}
            onSortKeyChange={(key) => {
              setSortKey(key)
              setSortDir(DEFAULT_SORT_DIR[key])
            }}
            sortDir={sortDir}
            sortKey={sortKey}
          />
        </div>
        <p className="m-0 px-1.5 text-[13px] text-[#8b8e98]">
          Dashboards others have shared with you. You can view and export them, but not edit.
        </p>

        <section aria-labelledby="shared-files-heading" className="mt-4">
          <h2 className="m-0 mb-3 text-[13px] font-semibold tracking-[0.13px] text-[#5f6368]" id="shared-files-heading">
            Files
          </h2>
          {shared.isPending ? (
            <SkeletonRegion label="Loading shared forms…">
              <FormCardGridSkeleton count={4} />
            </SkeletonRegion>
          ) : shared.isError ? (
            <div className="flex flex-wrap items-center gap-3 text-[14px] text-[#e0507a]">
              <span>Could not load shared forms.</span>
              <button
                className="cursor-pointer rounded-[10px] border border-[#e0507a] px-3 py-1 text-[13px] font-medium text-[#e0507a] transition-colors hover:bg-[#fcf3f6]"
                onClick={() => void shared.refetch()}
                type="button"
              >
                Try again
              </button>
            </div>
          ) : shared.data.length === 0 ? (
            <p className="m-0 text-[14px] text-[#8b8e98]">Nothing has been shared with you yet</p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(235px,100%),235px))] gap-x-8 gap-y-5.25 max-[560px]:grid-cols-1">
              {sortShared(shared.data, sortKey, sortDir).map((form) => (
                <div className="flex flex-col gap-1.5" key={form.id}>
                  <FormCard
                    image={placeholderFormImage(form.id)}
                    onOpen={() => navigate(formPath(form.urlId, 'dashboard'))}
                    title={form.formTitle ?? 'Untitled form'}
                    timeLabel={cardTime(form, sortKey).label}
                    updatedAt={cardTime(form, sortKey).at ? formatRelativeTime(cardTime(form, sortKey).at) : null}
                  />
                  {form.ownerName ? (
                    <Tooltip delayDuration={200}>
                      <TooltipTrigger asChild>
                        <p className="m-0 w-fit max-w-full truncate px-1 text-[12px] text-[#8b8e98]">
                          Shared by {form.ownerName}
                        </p>
                      </TooltipTrigger>
                      {form.ownerEmail && form.ownerEmail !== form.ownerName ? (
                        <TooltipContent side="bottom">{form.ownerEmail}</TooltipContent>
                      ) : null}
                    </Tooltip>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </PageContainer>
    </div>
  )
}
