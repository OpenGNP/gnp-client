import { ChevronDown, ChevronLeft, ChevronRight, Sparkles, TriangleAlert, X } from 'lucide-react'
import { useState } from 'react'

import type { IndividualField, IndividualPoint, IndividualResponse } from '../../api/analytics'
import type { DetailPanelLayout } from '../../hooks/useDetailPanelLayout'
import { formatDateTime } from '../../lib/responseWindow'
import { cn } from '../../lib/utils'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { DetailPanel } from './DetailPanel'
import { Highlight } from './Highlight'
import { SENTIMENT_BADGE_CLASSES } from './sentimentColors'
import { ViolationTooltip } from './ViolationTooltip'

const navButtonClass =
  'inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg border border-[#e8eaf1] bg-white px-2.5 text-[12px] font-semibold text-[#3f4045] hover:bg-[#f7f8fb] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white'

function FieldAnswer({
  field,
  number,
  values,
  query,
}: {
  field: IndividualField
  number: number
  values: string[]
  query: string
}) {
  return (
    <div className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
      <div className="flex items-start gap-2">
        <span className="mt-px shrink-0 rounded-[4px] bg-[#edf2fd] px-1.5 py-0.5 text-[11px] font-bold text-[#1e55c5]">
          Q{number}
        </span>
        <h4 className="m-0 text-[14px] leading-5.5 font-semibold text-[#14181f]">{field.title}</h4>
      </div>
      {values.length === 0 ? (
        <p className="m-0 text-[13px] text-[#726f6f] italic">No answer</p>
      ) : field.type === 'checkbox' ? (
        <div className="flex flex-wrap gap-1.5">
          {values.map((value) => (
            <span
              className="rounded-full border border-[#d6e0f7] bg-white px-2.5 py-1 text-[13px] text-[#3f4045]"
              key={value}
            >
              <Highlight query={query} text={value} />
            </span>
          ))}
        </div>
      ) : (
        <p className="m-0 rounded-[8px] bg-[#f7f8fb] px-3 py-2 text-[13px] leading-5.5 wrap-break-word whitespace-pre-wrap text-[#3f4045]">
          <Highlight query={query} text={values.join(', ')} />
        </p>
      )}
    </div>
  )
}

const AI_OPEN_KEY = 'gnp.responsePanel.aiAnalysisOpen'

// Per-viewer preference, open by default; storage can be unavailable (private mode).
function readAiOpen() {
  try {
    return window.localStorage.getItem(AI_OPEN_KEY) !== '0'
  } catch {
    return true
  }
}

/** What the AI made of the response: each point with its sentiment, flag and topic. */
function AiAnalysis({
  points,
  hasOpenText,
  query,
  onOpenTopic,
  openableTopicIds,
}: {
  points: IndividualPoint[]
  hasOpenText: boolean
  query: string
  onOpenTopic?: (topicId: string) => void
  openableTopicIds?: Set<string>
}) {
  // Kept while stepping through responses (and remembered), so a reader who folds it away stays folded.
  const [open, setOpen] = useState(readAiOpen)
  const toggle = (next: boolean) => {
    setOpen(next)
    try {
      window.localStorage.setItem(AI_OPEN_KEY, next ? '1' : '0')
    } catch {
      // Not remembered, still applied.
    }
  }
  return (
    <Collapsible className="flex flex-col gap-3" onOpenChange={toggle} open={open}>
      <h3 className="m-0">
        <CollapsibleTrigger className="group flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-[16px] font-bold tracking-[0.2px] text-[#14181f]">
          <Sparkles className="text-[#1e55c5]" size={15} />
          AI analysis
          {points.length > 0 ? <span className="font-medium text-[#726f6f]">({points.length})</span> : null}
          <ChevronDown className="text-[#726f6f] transition-transform group-data-[state=closed]:-rotate-90" size={15} />
        </CollapsibleTrigger>
      </h3>
      <CollapsibleContent className="flex flex-col gap-3">
      {points.length === 0 ? (
        <p className="m-0 text-[13px] text-[#726f6f]">
          {hasOpenText ? 'Not analysed yet.' : 'No written feedback to analyse.'}
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {points.map((point, i) => {
            // Only topics in the Themes list (current filters) can be opened there.
            const canOpen = point.topicId !== null && onOpenTopic && openableTopicIds?.has(point.topicId)
            return (
              <li className="flex flex-col gap-2 rounded-[10px] border border-[#e9eaed] p-3.5" key={i}>
                {point.sentiment || point.violation ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {point.sentiment ? (
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize',
                          SENTIMENT_BADGE_CLASSES[point.sentiment],
                        )}
                      >
                        {point.sentiment}
                      </span>
                    ) : null}
                    {point.violation ? (
                      <ViolationTooltip scope="point">
                        <span className="flex items-center gap-1 rounded-full bg-[#fcf3f6] px-2.5 py-1 text-[11px] font-semibold text-[#c2365f]">
                          <TriangleAlert size={11} />
                          Flagged
                        </span>
                      </ViolationTooltip>
                    ) : null}
                  </div>
                ) : null}
                <p className="m-0 text-[13px] leading-5.5 text-[#14181f]">
                  “<Highlight query={query} text={point.text} />”
                </p>
                <p className="m-0 text-[12px] text-[#726f6f]">
                  {point.topic === null ? (
                    'Not filed under a topic yet'
                  ) : canOpen ? (
                    <>
                      Topic:{' '}
                      <button
                        className="cursor-pointer border-0 bg-transparent p-0 font-semibold text-[#1e55c5] hover:underline"
                        onClick={() => onOpenTopic(point.topicId!)}
                        type="button"
                      >
                        {point.topic}
                      </button>
                    </>
                  ) : (
                    <>
                      Topic: <span className="font-medium text-[#3f4045]">{point.topic}</span>
                    </>
                  )}
                </p>
              </li>
            )
          })}
        </ul>
      )}
      </CollapsibleContent>
    </Collapsible>
  )
}

export type ResponseDetailPanelProps = {
  response: IndividualResponse
  /** From `responseLabels`. */
  label: string
  fields: IndividualField[]
  /** Position among the search results (0-based; -1: not among them) and their count, for "3 of 45". */
  index: number
  total: number
  /** The list's search, highlighted in the answers. */
  query: string
  onPrevious: () => void
  onNext: () => void
  onClose: () => void
  hideNames: boolean
  layout: DetailPanelLayout
  /** Opens a topic on the Themes tab, from the AI analysis. */
  onOpenTopic?: (topicId: string) => void
  /** Topics the Themes list holds right now (others can't be opened there). */
  openableTopicIds?: Set<string>
}

export function ResponseDetailPanel({
  response,
  label,
  fields,
  index,
  total,
  onPrevious,
  onNext,
  onClose,
  hideNames,
  layout,
  query,
  onOpenTopic,
  openableTopicIds,
}: ResponseDetailPanelProps) {
  const sections = [
    { title: 'Demographic', fields: fields.filter((field) => field.section === 'demographic') },
    { title: 'Feedback', fields: fields.filter((field) => field.section === 'feedback') },
  ].filter((section) => section.fields.length > 0)
  // Numbered in the order shown (demographic first), not form order.
  const displayed = sections.flatMap((section) => section.fields)

  return (
    <DetailPanel label={label || 'Response'} layout={layout} onClose={onClose}>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="m-0 text-[20px] font-bold text-black">{label}</h2>
          <button
            aria-label="Close response"
            className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-[6px] text-black transition-colors hover:bg-[#f7f8fb]"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>
        <p className="m-0 text-[12px] font-medium text-[#726f6f]">
          {formatDateTime(response.submittedAt)}
          {!hideNames && response.respondentName ? ` (Response #${response.number})` : null}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button className={navButtonClass} disabled={index <= 0} onClick={onPrevious} type="button">
          <ChevronLeft size={14} />
          Previous
        </button>
        <span className="text-[12px] font-medium text-[#726f6f]">
          {index >= 0 ? `${index + 1} of ${total}` : 'Not in the current results'}
        </span>
        <button className={navButtonClass} disabled={index < 0 || index === total - 1} onClick={onNext} type="button">
          Next
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Older servers don't send points: no section rather than a wrong "not analysed". */}
      {response.points ? (
        <AiAnalysis
          hasOpenText={fields.some(
            (field) =>
              field.section === 'feedback' &&
              (field.type === 'text' || field.type === 'textarea') &&
              (response.answers[field.id] ?? []).some((value) => value.trim() !== ''),
          )}
          onOpenTopic={onOpenTopic}
          openableTopicIds={openableTopicIds}
          points={response.points}
          query={query}
        />
      ) : null}

      {sections.map((section) => (
        <section className="flex flex-col gap-3" key={section.title}>
          <h3 className="m-0 text-[16px] font-bold tracking-[0.2px] text-[#14181f]">{section.title}</h3>
          <div className="flex flex-col divide-y divide-[#eef0f4] rounded-[10px] border border-[#e9eaed] p-4">
            {section.fields.map((field) => (
              <FieldAnswer
                field={field}
                key={field.id}
                number={displayed.indexOf(field) + 1}
                query={query}
                values={response.answers[field.id] ?? []}
              />
            ))}
          </div>
        </section>
      ))}
    </DetailPanel>
  )
}
