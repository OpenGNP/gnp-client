import { ChevronLeft, ChevronRight, X } from 'lucide-react'

import type { IndividualField, IndividualResponse } from '../../api/analytics'
import type { DetailPanelLayout } from '../../hooks/useDetailPanelLayout'
import { formatDateTime } from '../../lib/responseWindow'
import { DetailPanel } from './DetailPanel'
import { responseLabel } from './responseLabel'

const navButtonClass =
  'inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg border border-[#e8eaf1] bg-white px-2.5 text-[12px] font-semibold text-[#3f4045] hover:bg-[#f7f8fb] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white'

function FieldAnswer({ field, number, values }: { field: IndividualField; number: number; values: string[] }) {
  return (
    <div className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
      <div className="flex items-start gap-2">
        <span className="mt-px shrink-0 rounded-[4px] bg-[#edf2fd] px-1.5 py-0.5 text-[11px] font-bold text-[#1e55c5]">
          Q{number}
        </span>
        <h4 className="m-0 text-[14px] leading-5.5 font-semibold text-[#14181f]">{field.title}</h4>
      </div>
      {values.length === 0 ? (
        <p className="m-0 text-[13px] text-[#b5b7bd] italic">No answer</p>
      ) : field.type === 'checkbox' ? (
        <div className="flex flex-wrap gap-1.5">
          {values.map((value) => (
            <span
              className="rounded-full border border-[#d6e0f7] bg-white px-2.5 py-1 text-[13px] text-[#3f4045]"
              key={value}
            >
              {value}
            </span>
          ))}
        </div>
      ) : (
        <p className="m-0 rounded-[8px] bg-[#f7f8fb] px-3 py-2 text-[13px] leading-5.5 wrap-break-word whitespace-pre-wrap text-[#3f4045]">
          {values.join(', ')}
        </p>
      )}
    </div>
  )
}

export type ResponseDetailPanelProps = {
  response: IndividualResponse
  fields: IndividualField[]
  /** Position in the list (0-based) and its length, for "3 of 45". */
  index: number
  total: number
  onPrevious: () => void
  onNext: () => void
  onClose: () => void
  hideNames: boolean
  layout: DetailPanelLayout
}

export function ResponseDetailPanel({
  response,
  fields,
  index,
  total,
  onPrevious,
  onNext,
  onClose,
  hideNames,
  layout,
}: ResponseDetailPanelProps) {
  const sections = [
    { title: 'Demographic', fields: fields.filter((field) => field.section === 'demographic') },
    { title: 'Feedback', fields: fields.filter((field) => field.section === 'feedback') },
  ].filter((section) => section.fields.length > 0)
  // Numbered in the order shown (demographic first), not form order.
  const displayed = sections.flatMap((section) => section.fields)

  return (
    <DetailPanel layout={layout} onClose={onClose}>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="m-0 text-[18px] font-bold text-black">{responseLabel(response, hideNames)}</h2>
          <button
            aria-label="Close response"
            className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-[6px] text-black transition-colors hover:bg-[#f7f8fb]"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>
        <p className="m-0 text-[12px] font-medium text-[#929292]">
          {formatDateTime(response.submittedAt)}
          {!hideNames && response.respondentName ? ` · Response #${response.number}` : null}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button className={navButtonClass} disabled={index === 0} onClick={onPrevious} type="button">
          <ChevronLeft size={14} />
          Previous
        </button>
        <span className="text-[12px] font-medium text-[#726f6f]">
          {index + 1} of {total}
        </span>
        <button className={navButtonClass} disabled={index === total - 1} onClick={onNext} type="button">
          Next
          <ChevronRight size={14} />
        </button>
      </div>

      {sections.map((section) => (
        <section className="flex flex-col gap-3" key={section.title}>
          <h3 className="m-0 text-[11px] font-bold tracking-[0.6px] text-[#929292] uppercase">{section.title}</h3>
          <div className="flex flex-col divide-y divide-[#eef0f4] rounded-[10px] border border-[#e9eaed] p-4">
            {section.fields.map((field) => (
              <FieldAnswer
                field={field}
                key={field.id}
                number={displayed.indexOf(field) + 1}
                values={response.answers[field.id] ?? []}
              />
            ))}
          </div>
        </section>
      ))}
    </DetailPanel>
  )
}
