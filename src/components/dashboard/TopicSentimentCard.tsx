import { ArrowUpDown, ChevronDown, TriangleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'

import type { TopicSentiment } from '../../data/dashboardAnalytics'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Pagination } from './Pagination'
import { SentimentBar } from './SentimentBar'
import { computeAxisMax } from './topicAxis'
import { ViolationTooltip } from './ViolationTooltip'

const UNCATEGORISED_ID = 'uncategorised'

// Violation topics first, uncategorised last.
const pinRank = (topic: TopicSentiment) =>
  topic.id === UNCATEGORISED_ID ? 2 : topic.hasViolation ? 0 : 1

type SortOption = 'priority' | 'mentions' | 'positive'

const total = (topic: TopicSentiment) => topic.negative + topic.neutral + topic.positive

// Most negative feedback first, then most mentioned. Same order as the server.
const byPriority = (a: TopicSentiment, b: TopicSentiment) =>
  b.negative - a.negative || total(b) - total(a)

const SORT_OPTIONS: {
  value: SortOption
  label: string
  /** Shown under the label in the menu, when the name alone isn't self-explanatory. */
  hint?: string
  compare: (a: TopicSentiment, b: TopicSentiment) => number
}[] = [
  {
    value: 'priority',
    label: 'Priority',
    hint: 'Most negative feedback first',
    compare: byPriority,
  },
  {
    value: 'mentions',
    label: 'Most mentioned',
    compare: (a, b) => total(b) - total(a) || b.negative - a.negative,
  },
  {
    value: 'positive',
    label: 'Most positive',
    compare: (a, b) => b.positive - a.positive || total(b) - total(a),
  },
]

function TopicRow({
  axisMax,
  isSelected,
  onSelect,
  topic,
}: {
  axisMax: number
  isSelected: boolean
  onSelect?: (topicId: string) => void
  topic: TopicSentiment
}) {
  return (
    <button
      className={`flex h-[45px] w-full cursor-pointer items-center gap-4 border-l-[3px] py-0 pr-7.5 pl-6.75 text-left transition-colors ${
        isSelected
          ? 'border-[#1e55c5] bg-[#f7f8fb]'
          : topic.hasViolation
            ? 'border-transparent bg-[#fff7f8] hover:bg-[#fdeff1]'
            : 'border-transparent hover:bg-[#f7f8fb]'
      }`}
      onClick={() => onSelect?.(topic.id)}
      type="button"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="min-w-0 truncate text-[14px] text-[#14181f]">{topic.label}</span>
        {topic.hasViolation ? (
          <ViolationTooltip scope="topic">
            <TriangleAlert
              className="shrink-0 text-[#e0507a]"
              aria-label="Contains violations"
              size={16}
            />
          </ViolationTooltip>
        ) : null}
      </div>
      <SentimentBar
        className="w-60 shrink-0"
        maxValue={axisMax}
        negative={topic.negative}
        neutral={topic.neutral}
        positive={topic.positive}
        title={topic.label}
      />
      <span className="w-12 shrink-0 text-right text-[14px] text-[#14181f]">
        {topic.percentOfTotal}%
      </span>
    </button>
  )
}

function FeedbackPointsAxis({ axisMax }: { axisMax: number }) {
  return (
    <div className="flex h-6.25 w-full items-center gap-4 px-7.5 max-[900px]:hidden">
      <span className="min-w-0 flex-1 text-[12px] font-medium text-[#929292]">
        Feedback points:
      </span>
      <div className="flex w-60 shrink-0 items-center justify-between text-[12px] font-medium text-[#929292]">
        <span>0</span>
        <span>{axisMax}</span>
      </div>
      <span aria-hidden="true" className="w-12 shrink-0" />
    </div>
  )
}

export type TopicSentimentCardProps = {
  title: string
  topics: TopicSentiment[]
  sortable?: boolean
  pageSize?: number
  selectedTopicId?: string | null
  onSelectTopic?: (topicId: string) => void
  /** Shared scale for cards shown together, so equal bars mean equal counts. Default: this card's own topics. */
  axisMax?: number
  id?: string
}

export function TopicSentimentCard({
  title,
  topics,
  sortable = false,
  pageSize,
  selectedTopicId = null,
  onSelectTopic,
  axisMax: sharedAxisMax,
  id,
}: TopicSentimentCardProps) {
  const [sortOption, setSortOption] = useState<SortOption>('priority')
  const [page, setPage] = useState(1)

  const sortedTopics = useMemo(() => {
    if (!sortable) {
      return topics
    }
    const compare = SORT_OPTIONS.find((option) => option.value === sortOption)!.compare
    return [...topics].sort((a, b) => pinRank(a) - pinRank(b) || compare(a, b))
  }, [topics, sortable, sortOption])

  const totalPages = pageSize ? Math.max(1, Math.ceil(sortedTopics.length / pageSize)) : 1
  // Clamped: a refetch can leave fewer pages.
  const currentPage = Math.min(page, totalPages)
  const visibleTopics = pageSize
    ? sortedTopics.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedTopics

  const ownAxisMax = useMemo(() => computeAxisMax(topics), [topics])
  const axisMax = sharedAxisMax ?? ownAxisMax

  return (
    <section
      className="flex w-full scroll-mt-5 flex-col gap-3.25 rounded-[10px] border border-[#e9eaed] bg-white pt-7.25 pb-7.75"
      id={id}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-7.5">
        <h3 className="m-0 text-[14px] font-medium text-black">{title}</h3>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
          {sortable ? (
            <DropdownMenu>
              <div className="flex items-center gap-2.5">
                <span className="flex items-center gap-2.5 text-[12px] font-medium text-[#929292]">
                  <ArrowUpDown size={16} />
                  Sort by
                </span>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="h-8.75 gap-1.75 rounded-[10px] border-[#e6e7eb] px-2.5 text-[12px] text-black"
                    variant="outline"
                  >
                    {SORT_OPTIONS.find((option) => option.value === sortOption)!.label}
                    <ChevronDown
                      className="transition-transform group-data-[state=open]/button:rotate-180"
                      size={16}
                    />
                  </Button>
                </DropdownMenuTrigger>
              </div>
              <DropdownMenuContent className="min-w-45">
                {SORT_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    className={`border-l-[3px] ${option.value === sortOption ? 'border-[#1e55c5]' : 'border-transparent'}`}
                    key={option.value}
                    onSelect={() => {
                      setSortOption(option.value)
                      setPage(1)
                    }}
                  >
                    <span className="flex flex-col">
                      {option.label}
                      {option.hint ? (
                        <span className="text-[11px] text-[#929292]">{option.hint}</span>
                      ) : null}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col">
        <FeedbackPointsAxis axisMax={axisMax} />
        {visibleTopics.map((topic) => (
          <TopicRow
            axisMax={axisMax}
            isSelected={selectedTopicId === topic.id}
            key={topic.id}
            onSelect={onSelectTopic}
            topic={topic}
          />
        ))}
      </div>

      {pageSize && totalPages > 1 ? (
        <div className="px-7.5">
          <Pagination onPageChange={setPage} page={currentPage} totalPages={totalPages} />
        </div>
      ) : null}
    </section>
  )
}
