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

const AXIS_STEP = 10
const AXIS_MIN = 10

function computeAxisMax(topics: TopicSentiment[]): number {
  const highestCount = topics.reduce(
    (max, topic) => Math.max(max, topic.negative + topic.neutral + topic.positive),
    0,
  )
  return Math.max(AXIS_MIN, Math.ceil(highestCount / AXIS_STEP) * AXIS_STEP)
}

type SortOption = 'priority-desc' | 'priority-asc' | 'sentiment-pos-neg' | 'sentiment-neg-pos'

const SORT_OPTIONS: {
  value: SortOption
  label: string
  compare: (a: TopicSentiment, b: TopicSentiment) => number
}[] = [
  {
    value: 'priority-desc',
    label: 'Priority: High → Low',
    compare: (a, b) => b.percentOfTotal - a.percentOfTotal,
  },
  {
    value: 'priority-asc',
    label: 'Priority: Low → High',
    compare: (a, b) => a.percentOfTotal - b.percentOfTotal,
  },
  {
    value: 'sentiment-pos-neg',
    label: 'Sentiment: Pos → Neg',
    compare: (a, b) => b.positive - b.negative - (a.positive - a.negative),
  },
  {
    value: 'sentiment-neg-pos',
    label: 'Sentiment: Neg → Pos',
    compare: (a, b) => a.positive - a.negative - (b.positive - b.negative),
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
        isSelected ? 'border-[#1e55c5] bg-[#f7f8fb]' : 'border-transparent hover:bg-[#f7f8fb]'
      }`}
      onClick={() => onSelect?.(topic.id)}
      type="button"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="min-w-0 truncate text-[14px] text-[#14181f]">{topic.label}</span>
        {topic.isHighIntensity ? (
          <TriangleAlert
            className="shrink-0 text-[#e0507a]"
            aria-label="High intensity"
            size={16}
          />
        ) : null}
      </div>
      <SentimentBar
        className="w-60 shrink-0"
        maxValue={axisMax}
        negative={topic.negative}
        neutral={topic.neutral}
        positive={topic.positive}
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
}

export function TopicSentimentCard({
  title,
  topics,
  sortable = false,
  pageSize,
  selectedTopicId = null,
  onSelectTopic,
}: TopicSentimentCardProps) {
  const [sortOption, setSortOption] = useState<SortOption>('priority-desc')
  const [page, setPage] = useState(1)

  const sortedTopics = useMemo(() => {
    if (!sortable) {
      return topics
    }
    const compare = SORT_OPTIONS.find((option) => option.value === sortOption)!.compare
    return [...topics].sort(compare)
  }, [topics, sortable, sortOption])

  const totalPages = pageSize ? Math.max(1, Math.ceil(sortedTopics.length / pageSize)) : 1
  const visibleTopics = pageSize
    ? sortedTopics.slice((page - 1) * pageSize, page * pageSize)
    : sortedTopics

  const axisMax = useMemo(() => computeAxisMax(topics), [topics])

  return (
    <section className="flex w-full flex-col gap-3.25 rounded-[10px] border border-[#e9eaed] bg-white pt-7.25 pb-7.75">
      <div className="flex items-center justify-between px-7.5">
        <h3 className="m-0 text-[14px] font-medium text-black">{title}</h3>
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
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
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
          <Pagination onPageChange={setPage} page={page} totalPages={totalPages} />
        </div>
      ) : null}
    </section>
  )
}
