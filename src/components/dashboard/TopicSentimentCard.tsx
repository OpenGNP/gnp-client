import { ArrowUpDown, ChevronDown, MessageSquareText, Search, Sparkle, Sparkles, TrendingUp, TriangleAlert, X } from 'lucide-react'
import { useMemo, useState } from 'react'

import type { TopicSentiment } from '../../data/dashboardAnalytics'
import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
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

/** What changed (from the Trend tab) for the topics that got worse or are new, and the periods compared. */
export type TopicChanges = {
  current: string
  previous: string
  kinds: Record<string, 'worse' | 'new'>
}

/** "Worse" / "New" next to a topic's name; the tooltip says which periods were compared. */
function ChangeTag({ kind, changes }: { kind: 'worse' | 'new'; changes: TopicChanges }) {
  const worse = kind === 'worse'
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <span
          className={`inline-flex shrink-0 cursor-help items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            worse ? 'bg-[#fdecea] text-[#c4280b]' : 'bg-[#edf2fd] text-[#1e55c5]'
          }`}
        >
          {worse ? <TrendingUp size={12} /> : <Sparkle size={12} />}
          {worse ? 'Worse' : 'New'}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-64 whitespace-normal leading-4.5 text-[#3f4045]" side="top">
        {worse
          ? `Complaints rose in ${changes.current} compared with ${changes.previous}.`
          : `First mentioned in ${changes.current}.`}{' '}
        See the Trend tab for details.
      </TooltipContent>
    </Tooltip>
  )
}

function TopicRow({
  axisMax,
  isSelected,
  onSelect,
  topic,
  query,
  match,
  changes,
}: {
  changes?: TopicChanges
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
      className={`col-span-full grid min-h-13 w-full cursor-pointer grid-cols-subgrid items-center border-l-[3px] py-2.5 pr-7.5 pl-6.75 text-left transition-colors ${
        isSelected
          ? 'border-[#1e55c5] bg-[#f7f8fb]'
          : topic.hasViolation
            ? 'border-transparent bg-[#fff7f8] hover:bg-[#fdeff1]'
            : 'border-transparent hover:bg-[#f7f8fb]'
      }`}
      onClick={() => onSelect?.(topic.id)}
      type="button"
    >
      <div className="flex min-w-0 flex-col gap-0.5">
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
          {changes?.kinds[topic.id] ? <ChangeTag changes={changes} kind={changes.kinds[topic.id]!} /> : null}
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
        className="w-60 justify-self-center"
        maxValue={axisMax}
        negative={topic.negative}
        neutral={topic.neutral}
        positive={topic.positive}
        title={topic.label}
      />
      <span className="text-right text-[14px] text-[#14181f]">
        {topic.percentOfTotal}%
      </span>
    </button>
  )
}

function FeedbackPointsAxis({ axisMax }: { axisMax: number }) {
  return (
    <div className="col-span-full grid h-6.25 grid-cols-subgrid items-center px-7.5 max-[900px]:hidden">
      <span className="min-w-0 text-[12px] font-medium text-[#726f6f]">
        Mentions:
      </span>
      <div className="flex w-60 items-center justify-between justify-self-center text-[12px] font-medium text-[#726f6f]">
        <span>0</span>
        <span>{axisMax}</span>
      </div>
      {/* The row's % is its share of all feedback, not of negative. */}
      <span className="text-right text-[12px] font-medium text-[#726f6f]" title="Share of all feedback">
        Share
      </span>
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
  /** Tags topics that got worse or are new (What changed, same range and filters). */
  changes?: TopicChanges
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
  changes,
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
        <h3 className="m-0 flex items-center gap-1.5 text-[14px] font-medium text-black">
          <Sparkles aria-hidden className="shrink-0 text-[#1e55c5]" size={15} />
          {title}
        </h3>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
          {onQueryChange ? (
            <div className="flex items-center gap-2">
              {matches ? (
                <span aria-live="polite" className="text-[12px] font-medium text-[#726f6f]">
                  {sortedTopics.length} of {topics.length}
                </span>
              ) : null}
              <div className="flex h-8.75 w-56 items-center gap-2 rounded-[10px] border border-[#e6e7eb] px-2.5 focus-within:border-[#1e55c5]">
                <Search className="shrink-0 text-[#726f6f]" size={14} />
                <input
                  aria-label="Search topics and feedback"
                  className="w-full bg-transparent text-[12px] text-black outline-none placeholder:text-[#726f6f]"
                  onChange={(event) => onQueryChange(event.target.value)}
                  placeholder="Search topics or feedback…"
                  type="text"
                  value={query}
                />
                {query ? (
                  <button
                    aria-label="Clear search"
                    className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded text-[#726f6f] hover:bg-[#f7f8fb] hover:text-black"
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
                <span className="flex items-center gap-2.5 text-[12px] font-medium text-[#726f6f]">
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
                        <span className="text-[11px] text-[#726f6f]">{option.hint}</span>
                      ) : null}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>

      {/* One grid for the axis and every row: the name column is as wide as the longest name
          (capped), and each bar sits in the middle of the space between it and Share. */}
      <div className="grid grid-cols-[fit-content(55%)_minmax(15rem,1fr)_auto] gap-x-4">
        <FeedbackPointsAxis axisMax={axisMax} />
        {visibleTopics.map((topic) => (
          <TopicRow
            axisMax={axisMax}
            changes={changes}
            match={matches?.get(topic.id)}
            isSelected={selectedTopicId === topic.id}
            key={topic.id}
            onSelect={onSelectTopic}
            query={query}
            topic={topic}
          />
        ))}
        {matches && sortedTopics.length === 0 ? (
          <p className="col-span-full m-0 px-7.5 py-6 text-center text-[13px] text-[#726f6f]">
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
