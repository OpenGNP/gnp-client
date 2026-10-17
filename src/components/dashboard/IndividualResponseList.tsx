import { ChevronRight } from 'lucide-react'
import { useState } from 'react'

import type { FormIndividualResponses } from '../../api/analytics'
import { formatDateTime } from '../../lib/responseWindow'
import { cn } from '../../lib/utils'
import { Pagination } from './Pagination'
import { responseLabel } from './responseLabel'

const PAGE_SIZE = 10

export type IndividualResponseListProps = {
  data: FormIndividualResponses
  selectedId: number | null
  onSelect: (id: number) => void
  hideNames: boolean
}

export function IndividualResponseList({ data, selectedId, onSelect, hideNames }: IndividualResponseListProps) {
  const totalPages = Math.max(1, Math.ceil(data.responses.length / PAGE_SIZE))
  const pageOf = (id: number | null) => {
    const index = data.responses.findIndex((response) => response.id === id)
    return index >= 0 ? Math.floor(index / PAGE_SIZE) + 1 : null
  }
  // Opens on the selected response's page (e.g. arriving from the Themes tab).
  const [page, setPage] = useState(() => pageOf(selectedId) ?? 1)

  // Stepping through responses in the panel turns the list's page to follow.
  const [followedId, setFollowedId] = useState(selectedId)
  if (selectedId !== followedId) {
    setFollowedId(selectedId)
    const selectedPage = pageOf(selectedId)
    if (selectedPage !== null) setPage(selectedPage)
  }

  const currentPage = Math.min(page, totalPages)
  const visible = data.responses.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const demographicFields = data.fields.filter((field) => field.section === 'demographic')
  const textFields = data.fields.filter(
    (field) => field.section === 'feedback' && (field.type === 'text' || field.type === 'textarea'),
  )

  return (
    <div className="flex flex-col gap-4 rounded-[10px] border border-[#e9eaed] bg-white p-5">
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {visible.map((response) => {
          const demographics = demographicFields
            .flatMap((field) => response.answers[field.id] ?? [])
            .join(' · ')
          const preview = textFields.map((field) => response.answers[field.id]?.[0]).find(Boolean)
          const isSelected = response.id === selectedId

          return (
            <li key={response.id}>
              <button
                aria-current={isSelected ? 'true' : undefined}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-3 rounded-[8px] border px-4 py-3 text-left transition-colors',
                  isSelected
                    ? 'border-[#1e55c5] bg-[#f5f7fd]'
                    : 'border-[#e8eaf1] bg-white hover:bg-[#f7f8fb]',
                )}
                onClick={() => onSelect(response.id)}
                type="button"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-[14px] font-semibold text-[#14181f]">
                      {responseLabel(response, hideNames)}
                    </span>
                    <span className="shrink-0 text-[12px] text-[#929292]">
                      {formatDateTime(response.submittedAt)}
                    </span>
                  </div>
                  {demographics ? (
                    <span className="truncate text-[12px] font-medium text-[#726f6f]">{demographics}</span>
                  ) : null}
                  {preview ? (
                    <span className="line-clamp-1 text-[13px] text-[#3f4045]">“{preview}”</span>
                  ) : null}
                </div>
                <ChevronRight className="shrink-0 text-[#929292]" size={16} />
              </button>
            </li>
          )
        })}
      </ul>

      {totalPages > 1 ? (
        <div className="flex justify-end">
          <Pagination onPageChange={setPage} page={currentPage} totalPages={totalPages} />
        </div>
      ) : null}
    </div>
  )
}
