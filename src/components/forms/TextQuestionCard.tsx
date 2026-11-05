import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core'
import { Asterisk } from 'lucide-react'

import { cn } from '../../lib/utils'
import {
  LabeledToggle,
  MoveHandle,
  QuestionCardFooter,
  QuestionCardShell,
  QuestionTitleField,
  QuestionUseLabel,
  SegmentedToggle,
} from './QuestionCardControls'
import type { TextQuestion } from './question-types'

export type TextQuestionCardProps = {
  question: TextQuestion
  onChange: (question: TextQuestion) => void
  onDelete: () => void
  /** Position in its section, from 1. */
  number: number
  showAiAnalyze?: boolean
  dragHandleAttributes?: DraggableAttributes
  dragHandleListeners?: DraggableSyntheticListeners
}

export function TextQuestionCard({
  question,
  onChange,
  onDelete,
  number,
  showAiAnalyze = false,
  dragHandleAttributes,
  dragHandleListeners,
}: TextQuestionCardProps) {
  const isLong = question.answerLength === 'long'

  return (
    <QuestionCardShell>
      <QuestionTitleField
        onChange={(value) => onChange({ ...question, question: value })}
        number={number}
        onDelete={onDelete}
        value={question.question}
      />

      <div
        className={cn(
          'flex w-full items-start rounded-[5px] border border-[#d2d8e5] bg-[#f7f8fb] px-[15px] py-2.5 text-[14px] tracking-[0.14px] text-[#bdbdbd]',
          isLong ? 'h-[67px]' : 'h-[45px] items-center',
        )}
      >
        Enter your answer
      </div>

      <QuestionCardFooter>
        <SegmentedToggle
          label="Answer length"
          onChange={(answerLength) => onChange({ ...question, answerLength })}
          options={[
            { value: 'short', label: 'Short answer' },
            { value: 'long', label: 'Long answer' },
          ]}
          value={question.answerLength}
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

      <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center">
        <span aria-hidden="true" />
        <MoveHandle
          attributes={dragHandleAttributes}
          className="justify-self-center"
          listeners={dragHandleListeners}
        />
        <QuestionUseLabel analysed={showAiAnalyze} className="justify-self-end" type="text" />
      </div>
    </QuestionCardShell>
  )
}
