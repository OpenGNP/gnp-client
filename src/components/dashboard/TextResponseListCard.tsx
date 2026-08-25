import { useState } from 'react'
import { MessageSquareText } from 'lucide-react'

import type { TextResponseBreakdown } from '../../data/dashboardAnalytics'
import { Pagination } from './Pagination'

const PAGE_SIZE = 4

export type TextResponseListCardProps = {
  breakdown: TextResponseBreakdown
}

export function TextResponseListCard({ breakdown }: TextResponseListCardProps) {
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(breakdown.responses.length / PAGE_SIZE))
  const visibleResponses = breakdown.responses.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  )

  return (
    <div className="flex w-full flex-col gap-5 py-10">
      <div className="flex flex-col gap-2 px-7.5">
        <p className="m-0 text-[14px] font-medium text-black">{breakdown.title}</p>
        <p className="m-0 text-[12px] font-medium text-[#929292]">
          Response: {breakdown.responses.length}
        </p>
      </div>

      <div className="flex flex-col gap-3 px-10 max-[560px]:px-4">
        {visibleResponses.map((response, index) => (
          <div
            className="flex items-start gap-2.5 rounded-[8px] border border-[#e8eaf1] bg-[#f7f8fb] px-4 py-3"
            key={(page - 1) * PAGE_SIZE + index}
          >
            <MessageSquareText className="mt-0.5 shrink-0 text-[#929292]" size={16} />
            <p className="m-0 text-[14px] leading-5.5 text-[#3f4045]">{response}</p>
          </div>
        ))}
      </div>

      {totalPages > 1 ? (
        <div className="px-10 max-[560px]:px-4">
          <Pagination onPageChange={setPage} page={page} totalPages={totalPages} />
        </div>
      ) : null}
    </div>
  )
}
