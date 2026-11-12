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
    <div>
      {/* Side by side while both fit in full, else one row each; the 1px gap is the divider. */}
      <div className="flex flex-wrap gap-px overflow-hidden rounded-[10px] border border-[#e9eaed] bg-[#e9eaed]">
        {shown.map((insight) => (
          <button
            className="flex min-w-0 flex-auto cursor-pointer items-center gap-2.5 bg-white px-3.75 py-2.5 text-left transition-colors hover:bg-[#fbfcfe] focus-visible:outline-2 focus-visible:-outline-offset-2"
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
            <span className="flex min-w-0 items-center gap-2.5">
              {/* Only the name truncates; the details always show in full. */}
              <span className="min-w-0 truncate text-[14px] font-medium text-[#14181f]" title={insight.title}>
                {insight.title}
              </span>
              <span className="shrink-0 text-[12px] whitespace-nowrap text-[#726f6f]">
                {insight.share}% of all {insight.kind === 'fix' ? 'negative' : 'positive'} mentions
              </span>
            </span>
            <ChevronRight aria-hidden="true" className="ml-auto shrink-0 text-[#726f6f]" size={16} />
          </button>
        ))}
      </div>
    </div>
  )
}
