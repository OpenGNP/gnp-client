import { ArrowUpDown, ChevronDown, MessageSquareText, Search, TriangleAlert, X } from 'lucide-react'
import { useMemo, useState } from 'react'

import type { TopicSentiment } from '../../data/dashboardAnalytics'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Highlight } from './Highlight'
import { Pagination } from './Pagination'
import { SentimentBar } from './SentimentBar'
import { computeAxisMax } from './topicAxis'
import { searchTopics, type TopicMatch } from './topicSearch'
import { sortTopics, TOPIC_SORT_OPTIONS, topicSortLabel, type TopicSortOption } from './topicSort'
import { ViolationTooltip } from './ViolationTooltip'

function TopicRow({
  axisMax,
  isSelected,
  onSelect,
  topic,
  query,
  match,
}: {
  axisMax: number
  isSelected: boolean
  onSelect?: (topicId: string) => void
  topic: TopicSentiment
  query: string
  /** While searching: the feedback mentioning the query, shown under the name. */
  match?: TopicMatch
}) {
  return (
    <button
      className={`flex min-h-13 w-full cursor-pointer items-center gap-4 border-l-[3px] py-2.5 pr-7.5 pl-6.75 text-left transition-colors ${
        isSelected
          ? 'border-[#1e55c5] bg-[#f7f8fb]'
          : topic.hasViolation
            ? 'border-transparent bg-[#fff7f8] hover:bg-[#fdeff1]'
            : 'border-transparent hover:bg-[#f7f8fb]'
      }`}
      onClick={() => onSelect?.(topic.id)}
      type="button"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="min-w-0 truncate text-[14px] text-[#14181f]">
            <Highlight query={query} text={topic.label} />
          </span>
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
        {/* Own line under the name, so the name keeps the full width. */}
        {match?.snippet ? (
          <span className="flex min-w-0 items-center gap-1.5 text-[12px] text-[#726f6f]">
            <MessageSquareText className="shrink-0 text-[#1e55c5]" size={13} />
            <span className="shrink-0 font-semibold text-[#1e55c5]">{match.feedbackCount}</span>
            <span className="min-w-0 truncate">
              “<Highlight query={query} text={match.snippet} />”
            </span>
          </span>
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
  /** With `sortable`: the chosen order, held by the page so exports can follow it. Uncontrolled when omitted. */
  sort?: TopicSortOption
  onSortChange?: (sort: TopicSortOption) => void
  /** Given with `onQueryChange`: a search box filtering topics by name, keyword and feedback text. */
  query?: string
  onQueryChange?: (query: string) => void
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
  query = '',
  onQueryChange,
  sort,
  onSortChange,
}: TopicSentimentCardProps) {
  const [ownSort, setOwnSort] = useState<TopicSortOption>('priority')
  const sortOption = sort ?? ownSort
  const setSortOption = (next: TopicSortOption) => {
    setOwnSort(next)
    onSortChange?.(next)
  }
  const [page, setPage] = useState(1)

  const matches = useMemo(() => searchTopics(topics, query), [topics, query])
  // A new search starts from the first page of its results.
  const [searchedQuery, setSearchedQuery] = useState(query)
  if (query !== searchedQuery) {
    setSearchedQuery(query)
    setPage(1)
  }

  const sortedTopics = useMemo(() => {
    const found = matches ? topics.filter((topic) => matches.has(topic.id)) : topics
    if (!sortable) {
      return found
    }
    return sortTopics(found, sortOption)
  }, [topics, matches, sortable, sortOption])

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
          {onQueryChange ? (
            <div className="flex items-center gap-2">
              {matches ? (
                <span aria-live="polite" className="text-[12px] font-medium text-[#726f6f]">
                  {sortedTopics.length} of {topics.length}
                </span>
              ) : null}
              <div className="flex h-8.75 w-56 items-center gap-2 rounded-[10px] border border-[#e6e7eb] px-2.5 focus-within:border-[#1e55c5]">
                <Search className="shrink-0 text-[#929292]" size={14} />
                <input
                  aria-label="Search topics and feedback"
                  className="w-full bg-transparent text-[12px] text-black outline-none placeholder:text-[#929292]"
                  onChange={(event) => onQueryChange(event.target.value)}
                  placeholder="Search topics or feedback…"
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
                    <X size={13} />
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
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
                    {topicSortLabel(sortOption)}
                    <ChevronDown
                      className="transition-transform group-data-[state=open]/button:rotate-180"
                      size={16}
                    />
                  </Button>
                </DropdownMenuTrigger>
              </div>
              <DropdownMenuContent className="min-w-45">
                {TOPIC_SORT_OPTIONS.map((option) => (
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
            match={matches?.get(topic.id)}
            isSelected={selectedTopicId === topic.id}
            key={topic.id}
            onSelect={onSelectTopic}
            query={query}
            topic={topic}
          />
        ))}
        {matches && sortedTopics.length === 0 ? (
          <p className="m-0 px-7.5 py-6 text-center text-[13px] text-[#726f6f]">
            No topics or feedback match “{query.trim()}”.
          </p>
        ) : null}
      </div>

      {pageSize && totalPages > 1 ? (
        <div className="px-7.5">
          <Pagination onPageChange={setPage} page={currentPage} totalPages={totalPages} />
        </div>
      ) : null}
    </section>
  )
}
