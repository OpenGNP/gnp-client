import { ArrowUpDown, ChevronDown, TriangleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DropdownMenu } from 'radix-ui'

import type { TopicSentiment } from '../../data/dashboardAnalytics'
import { Pagination } from './Pagination'
import { SentimentBar } from './SentimentBar'

const AXIS_MAX = 50

function TopicRow({ topic }: { topic: TopicSentiment }) {
  return (
    <div className="flex h-[45px] w-full items-center justify-between px-7.5">
      <div className="flex w-38 shrink-0 items-center justify-between gap-2">
        <span className="truncate text-[14px] text-[#14181f]">{topic.label}</span>
        {topic.isHighIntensity ? (
          <TriangleAlert
            className="shrink-0 text-[#e0507a]"
            aria-label="High intensity"
            size={16}
          />
        ) : null}
      </div>
      <div className="flex flex-1 items-center justify-end gap-6">
        <SentimentBar
          maxValue={AXIS_MAX}
          negative={topic.negative}
          neutral={topic.neutral}
          positive={topic.positive}
        />
        <span className="w-12 shrink-0 text-right text-[14px] text-[#14181f]">
          {topic.percentOfTotal}%
        </span>
      </div>
    </div>
  )
}

function FeedbackPointsAxis() {
  return (
    <div className="flex h-6.25 w-full items-center justify-end gap-63.5 px-7.5 max-[900px]:hidden">
      <span className="text-[12px] font-medium text-[#929292]">Feedback points:</span>
      <span className="text-[12px] font-medium text-[#929292]">0</span>
      <span className="mr-8 text-[12px] font-medium text-[#929292]">{AXIS_MAX}</span>
    </div>
  )
}

export type TopicSentimentCardProps = {
  title: string
  topics: TopicSentiment[]
  sortable?: boolean
  pageSize?: number
}

export function TopicSentimentCard({
  title,
  topics,
  sortable = false,
  pageSize,
}: TopicSentimentCardProps) {
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc')
  const [page, setPage] = useState(1)

  const sortedTopics = useMemo(() => {
    if (!sortable) {
      return topics
    }
    return [...topics].sort((a, b) =>
      sortDirection === 'desc'
        ? b.percentOfTotal - a.percentOfTotal
        : a.percentOfTotal - b.percentOfTotal,
    )
  }, [topics, sortable, sortDirection])

  const totalPages = pageSize ? Math.max(1, Math.ceil(sortedTopics.length / pageSize)) : 1
  const visibleTopics = pageSize
    ? sortedTopics.slice((page - 1) * pageSize, page * pageSize)
    : sortedTopics

  return (
    <section className="flex w-full flex-col gap-3.25 rounded-[10px] border border-[#e9eaed] bg-white pt-7.25 pb-7.75">
      <div className="flex items-center justify-between px-7.5">
        <h3 className="m-0 text-[14px] font-medium text-black">{title}</h3>
        {sortable ? (
          <DropdownMenu.Root>
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-2.5 text-[12px] font-medium text-[#929292]">
                <ArrowUpDown size={16} />
                Sort by
              </span>
              <DropdownMenu.Trigger asChild>
                <button
                  className="inline-flex h-8.75 cursor-pointer items-center gap-1.75 rounded-[10px] border border-[#e6e7eb] bg-white px-2.5 text-[12px] text-black hover:bg-[#f7f8fb]"
                  type="button"
                >
                  Priority: {sortDirection === 'desc' ? 'High → Low' : 'Low → High'}
                  <ChevronDown size={16} />
                </button>
              </DropdownMenu.Trigger>
            </div>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                className="z-40 min-w-45 overflow-hidden rounded-[8px] border border-[#e8eaf1] bg-white py-1 shadow-[0_8px_24px_rgba(15,23,42,0.14)]"
                sideOffset={4}
              >
                <DropdownMenu.Item
                  className="cursor-pointer px-3 py-2 text-[13px] font-medium text-[#3f4045] outline-none data-highlighted:bg-[#f7f8fb]"
                  onSelect={() => {
                    setSortDirection('desc')
                    setPage(1)
                  }}
                >
                  Priority: High → Low
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="cursor-pointer px-3 py-2 text-[13px] font-medium text-[#3f4045] outline-none data-highlighted:bg-[#f7f8fb]"
                  onSelect={() => {
                    setSortDirection('asc')
                    setPage(1)
                  }}
                >
                  Priority: Low → High
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        ) : null}
      </div>

      <div className="flex flex-col">
        <FeedbackPointsAxis />
        {visibleTopics.map((topic) => (
          <TopicRow key={topic.id} topic={topic} />
        ))}
      </div>

      {pageSize && totalPages > 1 ? (
        <div className="px-7.5">
          <Pagination onPageChange={setPage} page={page} totalPages={totalPages} />
        </div>
      ) : null}
    </section>
  )
}
