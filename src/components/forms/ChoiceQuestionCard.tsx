import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core'
import { Asterisk, Circle, MessageSquareText, Plus, Square, X } from 'lucide-react'

import {
  LabeledToggle,
  MoveHandle,
  QuestionCardFooter,
  QuestionCardShell,
  QuestionTitleField,
} from './QuestionCardControls'
import type { ChoiceQuestion } from './question-types'

export type ChoiceQuestionCardProps = {
  question: ChoiceQuestion
  onChange: (question: ChoiceQuestion) => void
  onDelete: () => void
  dragHandleAttributes?: DraggableAttributes
  dragHandleListeners?: DraggableSyntheticListeners
}

export function ChoiceQuestionCard({
  question,
  onChange,
  onDelete,
  dragHandleAttributes,
  dragHandleListeners,
}: ChoiceQuestionCardProps) {
  const OptionIcon = question.allowMultiple ? Square : Circle

  const updateOption = (index: number, value: string) => {
    const options = question.options.slice()
    options[index] = value
    onChange({ ...question, options })
  }

  const addOption = () => {
    onChange({ ...question, options: [...question.options, ''] })
  }

  const removeOption = (index: number) => {
    onChange({
      ...question,
      options: question.options.filter((_, optionIndex) => optionIndex !== index),
    })
  }

  return (
    <QuestionCardShell>
      <QuestionTitleField
        onChange={(value) => onChange({ ...question, question: value })}
        onDelete={onDelete}
        value={question.question}
      />

      <div className="flex w-full flex-col gap-3">
        {question.options.map((option, index) => (
          <div className="flex w-full items-center gap-4 pl-2.5" key={index}>
            <OptionIcon
              className="shrink-0 text-[#616161]"
              size={20}
              strokeWidth={1.75}
            />
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <input
                className="h-9.75 min-w-0 flex-1 rounded-[5px] border border-[#d2d8e5] bg-[#f7f8fb] px-[15px] text-[14px] text-black tracking-[0.14px] outline-none placeholder:text-[#bdbdbd] focus:border-[#1e55c5]"
                onChange={(event) => updateOption(index, event.target.value)}
                placeholder={`Option ${index + 1}`}
                value={option}
              />
              {question.options.length > 1 ? (
                <button
                  className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-[#b0b1b3] hover:text-[#e0507a] focus-visible:ring-2 focus-visible:ring-[#1e55c5]/40 focus-visible:outline-none"
                  aria-label={`Remove option ${index + 1}`}
                  onClick={() => removeOption(index)}
                  type="button"
                >
                  <X size={16} />
                </button>
              ) : null}
            </div>
          </div>
        ))}

        {question.hasOther ? (
          <div className="flex w-full items-center gap-4 pl-2.5">
            <OptionIcon
              className="shrink-0 text-[#616161]"
              size={20}
              strokeWidth={1.75}
            />
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className="h-9.75 min-w-0 flex-1 rounded-[5px] border border-[#d2d8e5] bg-[#f7f8fb] px-[15px] py-2.5 text-[14px] tracking-[0.14px] text-[#bdbdbd]">
                Other
              </div>
              <button
                className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-[#b0b1b3] hover:text-[#e0507a] focus-visible:ring-2 focus-visible:ring-[#1e55c5]/40 focus-visible:outline-none"
                aria-label='Remove "Other" option'
                onClick={() => onChange({ ...question, hasOther: false })}
                type="button"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex w-full flex-wrap items-center gap-4">
        <button
          className="inline-flex cursor-pointer items-center gap-2.5 rounded-[11px] border-0 bg-transparent px-2.5 py-2.5 text-[16px] tracking-[0.16px] text-[#1e55c5] hover:bg-[#f7f8fb] focus-visible:ring-2 focus-visible:ring-[#1e55c5]/40 focus-visible:outline-none"
          onClick={addOption}
          type="button"
        >
          <Plus size={20} />
          <span>Add option</span>
        </button>
        <span className="h-7 w-px bg-[#e8eaf1]" aria-hidden="true" />
        <button
          className="inline-flex cursor-pointer items-center rounded-[11px] border-0 bg-transparent px-2.5 py-2.5 text-[16px] tracking-[0.16px] text-[#1e55c5] hover:bg-[#f7f8fb] focus-visible:ring-2 focus-visible:ring-[#1e55c5]/40 focus-visible:outline-none"
          onClick={() => onChange({ ...question, hasOther: !question.hasOther })}
          type="button"
        >
          Add "Other" option
        </button>
      </div>

      <QuestionCardFooter>
        <LabeledToggle
          checked={question.allowMultiple}
          chipClassName="bg-[#e8eeff] text-[#1e55c5]"
          className="w-[243px]"
          icon={<MessageSquareText size={15} />}
          label={question.allowMultiple ? 'Multiple answers' : 'Single answer'}
          onCheckedChange={(checked) => onChange({ ...question, allowMultiple: checked })}
        />
        <LabeledToggle
          checked={question.required}
          chipClassName="bg-[#fcf3f6] text-[#e0507a]"
          className="w-[181px]"
          icon={<Asterisk size={15} />}
          label="Required"
          onCheckedChange={(checked) => onChange({ ...question, required: checked })}
        />
      </QuestionCardFooter>

      <MoveHandle attributes={dragHandleAttributes} listeners={dragHandleListeners} />
    </QuestionCardShell>
  )
}
