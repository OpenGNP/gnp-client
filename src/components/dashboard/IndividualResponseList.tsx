import { ChevronRight, Search, X } from 'lucide-react'
import { useState } from 'react'

import { formatDateTime } from '../../lib/responseWindow'
import { cn } from '../../lib/utils'
import { Highlight } from './Highlight'
import { Pagination } from './Pagination'
import type { ResponseSearchResult } from './responseSearch'

const PAGE_SIZE = 10

export type IndividualResponseListProps = {
  /** The responses matching `query` (all of them when it's empty), from `searchResponses`. */
  results: ResponseSearchResult[]
  /** Every response, for "12 of 636". */
  total: number
  query: string
  onQueryChange: (query: string) => void
  selectedId: number | null
  onSelect: (id: number) => void
  /** From `responseLabels`. */
  labels: Map<number, string>
}

export function IndividualResponseList({
  results,
  total,
  query,
  onQueryChange,
  selectedId,
  onSelect,
  labels,
}: IndividualResponseListProps) {
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const pageOf = (id: number | null) => {
    const index = results.findIndex((result) => result.response.id === id)
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

  // A new search starts from the first page of its results.
  const [searchedQuery, setSearchedQuery] = useState(query)
  if (query !== searchedQuery) {
    setSearchedQuery(query)
    setPage(1)
  }

  const currentPage = Math.min(page, totalPages)
  const visible = results.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const isSearching = query.trim() !== ''

  return (
    <div className="flex flex-col gap-4 rounded-[10px] border border-[#e9eaed] bg-white p-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-60 flex-1 items-center gap-2 rounded-[8px] border border-[#e6e7eb] px-3 py-2 focus-within:border-[#1e55c5]">
          <Search className="shrink-0 text-[#929292]" size={16} />
          <input
            aria-label="Search responses"
            className="w-full bg-transparent text-[13px] text-black outline-none placeholder:text-[#929292]"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search names or answers…"
            type="text"
            value={query}
          />
          {query ? (
            <button
              aria-label="Clear search"
              className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded text-[#929292] hover:bg-[#f7f8fb] hover:text-black"
              onClick={() => onQueryChange('')}
              type="button"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>
        {isSearching ? (
          <span aria-live="polite" className="text-[12px] font-medium text-[#726f6f]">
            {results.length} of {total} responses
          </span>
        ) : null}
      </div>

      {results.length === 0 ? (
        <p className="m-0 py-6 text-center text-[13px] text-[#726f6f]">No responses match “{query.trim()}”.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {visible.map(({ response, snippet }) => {
            const isSelected = response.id === selectedId

            return (
              <li key={response.id}>
                <button
                  aria-current={isSelected ? 'true' : undefined}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-3 rounded-[10px] border px-4 py-3 text-left transition-colors',
                    isSelected
                      ? 'border-[#1e55c5] bg-[#f5f7fd]'
                      : 'border-[#e8eaf1] bg-white hover:bg-[#f7f8fb]',
                  )}
                  onClick={() => onSelect(response.id)}
                  type="button"
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-[14px] font-semibold text-[#14181f]">
                        <Highlight query={query} text={labels.get(response.id) ?? ''} />
                      </span>
                      <span className="shrink-0 text-[12px] text-[#929292]">
                        {formatDateTime(response.submittedAt)}
                      </span>
                    </span>
                    {/* Only while searching: where the match is. */}
                    {snippet ? (
                      <span className="line-clamp-1 text-[13px] text-[#3f4045]">
                        <Highlight query={query} text={snippet} />
                      </span>
                    ) : null}
                  </span>
                  <ChevronRight className="shrink-0 text-[#929292]" size={16} />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {totalPages > 1 ? (
        <div>
          <Pagination onPageChange={setPage} page={currentPage} totalPages={totalPages} />
        </div>
      ) : null}
    </div>
  )
}
