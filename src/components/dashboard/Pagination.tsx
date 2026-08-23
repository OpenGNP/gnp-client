import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

import { cn } from '../../lib/utils'

export type PaginationProps = {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

const controlClass =
  'inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#f1f1f1] bg-white text-[#3f4045] hover:bg-[#f7f8fb] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white'

function getVisiblePages(page: number, totalPages: number) {
  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1])
  return [...pages]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b)
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const visiblePages = getVisiblePages(page, totalPages)

  return (
    <nav className="flex items-start gap-1.5" aria-label="Pagination">
      <button
        className={controlClass}
        aria-label="First page"
        disabled={page === 1}
        onClick={() => onPageChange(1)}
        type="button"
      >
        <ChevronsLeft size={16} />
      </button>
      <button
        className={controlClass}
        aria-label="Previous page"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        type="button"
      >
        <ChevronLeft size={16} />
      </button>

      {visiblePages.map((pageNumber, index) => {
        const previousPage = visiblePages[index - 1]
        const showEllipsisBefore = previousPage !== undefined && pageNumber - previousPage > 1

        return (
          <span className="flex items-center gap-1.5" key={pageNumber}>
            {showEllipsisBefore ? (
              <span className="flex size-8 items-center justify-center text-[13px] text-[#333]">
                …
              </span>
            ) : null}
            <button
              className={cn(
                controlClass,
                pageNumber === page && 'border-[#1e55c5] bg-[#1e55c5] text-white hover:bg-[#1a49aa]',
              )}
              aria-current={pageNumber === page ? 'page' : undefined}
              onClick={() => onPageChange(pageNumber)}
              type="button"
            >
              {pageNumber}
            </button>
          </span>
        )
      })}

      <button
        className={controlClass}
        aria-label="Next page"
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        type="button"
      >
        <ChevronRight size={16} />
      </button>
      <button
        className={controlClass}
        aria-label="Last page"
        disabled={page === totalPages}
        onClick={() => onPageChange(totalPages)}
        type="button"
      >
        <ChevronsRight size={16} />
      </button>
    </nav>
  )
}
