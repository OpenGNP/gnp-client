import { useState } from 'react'
import { MessageSquareText } from 'lucide-react'

import type { TextResponse, TextResponseBreakdown } from '../../data/dashboardAnalytics'
import { cn } from '../../lib/utils'
import { Pagination } from './Pagination'

const PAGE_SIZE = 4
const LONG_RESPONSE_THRESHOLD = 220

const toTextResponse = (response: string | TextResponse): TextResponse =>
  typeof response === 'string' ? { text: response, respondentName: null } : response

function ResponseCard({ response, showName }: { response: TextResponse; showName: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isLong = response.text.length > LONG_RESPONSE_THRESHOLD

  return (
    <div className="flex items-start gap-2.5 rounded-[8px] border border-[#e8eaf1] bg-[#f7f8fb] px-4 py-3">
      <MessageSquareText className="mt-0.5 shrink-0 text-[#929292]" size={16} />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'm-0 text-[14px] leading-5.5 wrap-break-word text-[#3f4045]',
            isLong && !isExpanded && 'line-clamp-3',
          )}
        >
          {response.text}
        </p>
        {isLong ? (
          <button
            className="mt-1 cursor-pointer border-0 bg-transparent p-0 text-[12px] font-semibold text-[#1e55c5] hover:underline"
            onClick={() => setIsExpanded((value) => !value)}
            type="button"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        ) : null}
        {showName ? (
          <p
            className={cn(
              'm-0 mt-1.5 text-[12px]',
              response.respondentName ? 'font-medium text-[#726f6f]' : 'text-[#929292]',
            )}
          >
            {response.respondentName ?? 'Anonymous'}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export type TextResponseListCardProps = {
  breakdown: TextResponseBreakdown
  /** The dashboard's "Hide names" toggle. */
  hideNames?: boolean
}

export function TextResponseListCard({ breakdown, hideNames = false }: TextResponseListCardProps) {
  const [page, setPage] = useState(1)

  const responses = breakdown.responses.map(toTextResponse)
  // Names only when this form recorded any — otherwise every card would just say "Anonymous".
  const showNames = !hideNames && responses.some((response) => response.respondentName)
  const totalPages = Math.max(1, Math.ceil(responses.length / PAGE_SIZE))
  const visibleResponses = responses.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  )

  return (
    <div className="flex w-full flex-col gap-5 py-10">
      <div className="flex flex-col gap-2 px-7.5">
        <p className="m-0 text-[14px] font-medium text-black">{breakdown.title}</p>
        <p className="m-0 text-[12px] font-medium text-[#929292]">
          Response: {responses.length}
        </p>
      </div>

      <div className="flex flex-col gap-3 px-10 max-[560px]:px-4">
        {visibleResponses.map((response, index) => (
          <ResponseCard
            key={(page - 1) * PAGE_SIZE + index}
            response={response}
            showName={showNames}
          />
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
