import { TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'

import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'

function headline(scope: 'point' | 'topic', count?: number) {
  if (scope === 'point') return 'The AI flagged this feedback as a violation'
  if (count !== undefined) {
    return `The AI flagged ${count} ${count === 1 ? 'mention' : 'mentions'} in this topic as violations`
  }
  return 'This topic has feedback the AI flagged as a violation'
}

/** Explains the violation tag on hover — the same wording wherever the tag appears. */
export function ViolationTooltip({
  scope,
  count,
  children,
}: {
  scope: 'point' | 'topic'
  /** Number of flagged mentions, when the tag shows one. */
  count?: number
  children: ReactNode
}) {
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <span className="inline-flex shrink-0 cursor-help">{children}</span>
      </TooltipTrigger>
      <TooltipContent className="w-max max-w-[min(22.5rem,calc(100vw-2rem))] whitespace-normal leading-4.5" side="top">
        <span className="flex items-start gap-1.5 font-medium text-[#14181f]">
          <TriangleAlert className="mt-0.5 shrink-0 text-[#e0507a]" size={13} />
          {headline(scope, count)}
        </span>
        {/* Matches gnp-ai's zero-shot labels (pipeline/violation.py ZEROSHOT_LABELS). */}
        <span className="mt-0.5 block pl-5 text-[11px] text-[#726f6f]">
          Means: a breach of law, ethics or morals.
        </span>
        {/* Only where someone acts on a single piece of feedback. */}
        {scope === 'point' ? (
          <span className="mt-1.5 block pl-5 text-[11px] text-[#929292]">
            Flagged automatically — the AI can be wrong.
          </span>
        ) : null}
      </TooltipContent>
    </Tooltip>
  )
}
