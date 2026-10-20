import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core'
import { Circle, Sparkles, Square } from 'lucide-react'

import { MoveHandle } from './QuestionCardControls'
import type { Question } from './question-types'

/**
 * A question that isn't being edited: what it asks and how it's answered, read-only and
 * compact. Clicking anywhere on it opens the full editor card in its place.
 */
export function QuestionPreviewCard({
  question,
  showAiAnalyze = false,
  onActivate,
  dragHandleAttributes,
  dragHandleListeners,
}: {
  question: Question
  showAiAnalyze?: boolean
  onActivate: () => void
  dragHandleAttributes?: DraggableAttributes
  dragHandleListeners?: DraggableSyntheticListeners
}) {
  const OptionIcon = question.type === 'choice' && question.allowMultiple ? Square : Circle

  return (
    <div
      className="flex w-full cursor-pointer flex-col gap-3 rounded-[5px] bg-white px-5.5 pt-5 pb-2 shadow-[0_2px_4.1px_rgba(0,0,0,0.11)] transition-shadow hover:shadow-[0_3px_10px_rgba(0,0,0,0.14)] max-[560px]:px-4"
      onClick={onActivate}
    >
      {/* The keyboard way in; the whole card answers to the mouse. */}
      <button
        className="cursor-pointer border-0 bg-transparent p-0 text-left text-[16px] tracking-[0.16px] text-black focus-visible:rounded-[4px] focus-visible:ring-2 focus-visible:ring-[#1e55c5]/40 focus-visible:outline-none"
        type="button"
      >
        {question.question.trim() || <span className="text-[#bdbdbd]">Untitled question</span>}
        {question.required ? <span className="ml-1 text-[#e0507a]">*</span> : null}
      </button>

      {question.type === 'text' ? (
        <p className="m-0 text-[14px] tracking-[0.14px] text-[#9a9ca5]">
          {question.answerLength === 'long' ? 'Long answer' : 'Short answer'}
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {question.options.map((option, index) => (
            <li className="flex items-center gap-3 text-[14px] text-[#3f4045]" key={index}>
              <OptionIcon className="shrink-0 text-[#9a9ca5]" size={16} />
              {option.trim() || <span className="text-[#bdbdbd]">Option {index + 1}</span>}
            </li>
          ))}
          {question.hasOther ? (
            <li className="flex items-center gap-3 text-[14px] text-[#9a9ca5]">
              <OptionIcon className="shrink-0" size={16} />
              Other
            </li>
          ) : null}
        </ul>
      )}

      <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center">
        <span aria-hidden="true" />
        {/* Dragging shouldn't also open the card. */}
        <span className="justify-self-center" onClick={(event) => event.stopPropagation()}>
          <MoveHandle attributes={dragHandleAttributes} listeners={dragHandleListeners} />
        </span>
        {showAiAnalyze && question.type === 'text' ? (
          <span className="inline-flex items-center gap-1.5 justify-self-end text-[12px] text-[#1e55c5]">
            <Sparkles size={13} />
            AI Analyze
          </span>
        ) : (
          <span aria-hidden="true" />
        )}
      </div>
    </div>
  )
}
