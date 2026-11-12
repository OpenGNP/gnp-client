import { ChevronRight, ThumbsDown, ThumbsUp } from 'lucide-react'

import { INSIGHT_STYLES, type Insight } from '../report/keyInsights'

// Not Trend's arrows, which mean worse / improving there.
const ICONS = {
  fix: <ThumbsDown size={13} strokeWidth={2.4} />,
  keep: <ThumbsUp size={13} strokeWidth={2.4} />,
}

/** "Fix first" and "Keep doing" in one slim bar above the topics; each opens its topic. */
export function InsightStrip({ insights, onSelectTopic }: { insights: Insight[]; onSelectTopic: (topicId: string) => void }) {
  const items = insights.filter(
    (insight): insight is Insight & { kind: 'fix' | 'keep'; topicId: string } =>
      (insight.kind === 'fix' || insight.kind === 'keep') && insight.topicId !== null,
  )
  // One of each: the first concern and the most praised.
  const shown = [items.find((i) => i.kind === 'fix'), items.find((i) => i.kind === 'keep')].filter((i) => i !== undefined)
  if (shown.length === 0) return null

  return (
    <div className="@container">
      <div className="flex flex-col overflow-hidden rounded-[10px] border border-[#e9eaed] bg-white @min-[40rem]:flex-row">
        {shown.map((insight) => (
          <button
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 border-[#e9eaed] px-3.75 py-2.5 text-left transition-colors not-first:border-t hover:bg-[#fbfcfe] focus-visible:outline-2 focus-visible:-outline-offset-2 @min-[40rem]:not-first:border-t-0 @min-[40rem]:not-first:border-l"
            key={insight.kind}
            onClick={() => onSelectTopic(insight.topicId)}
            type="button"
          >
            <span className={`inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold ${INSIGHT_STYLES[insight.kind].text}`}>
              <span aria-hidden="true" className="flex">
                {ICONS[insight.kind]}
              </span>
              {insight.label}
            </span>
            <span className="min-w-0 truncate text-[14px] font-medium text-[#14181f]" title={insight.title}>
              {insight.title}
            </span>
            {/* Dropped first when space runs out, so the topic name stays readable. */}
            <span className="hidden shrink-0 text-[12px] text-[#726f6f] @min-[30rem]:inline">
              {insight.share}% of all {insight.kind === 'fix' ? 'negative' : 'positive'} mentions
            </span>
            <ChevronRight aria-hidden="true" className="ml-auto shrink-0 text-[#726f6f]" size={16} />
          </button>
        ))}
      </div>
    </div>
  )
}
