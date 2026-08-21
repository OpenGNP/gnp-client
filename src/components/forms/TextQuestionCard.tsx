import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core'
import { Asterisk, MessageSquareText } from 'lucide-react'

import { cn } from '../../lib/utils'
import {
  AiAnalyzeLabel,
  LabeledToggle,
  MoveHandle,
  QuestionCardFooter,
  QuestionCardShell,
  QuestionTitleField,
} from './QuestionCardControls'
import type { TextQuestion } from './question-types'

export type TextQuestionCardProps = {
  question: TextQuestion
  onChange: (question: TextQuestion) => void
  onDelete: () => void
  showAiAnalyze?: boolean
  dragHandleAttributes?: DraggableAttributes
  dragHandleListeners?: DraggableSyntheticListeners
}

export function TextQuestionCard({
  question,
  onChange,
  onDelete,
  showAiAnalyze = false,
  dragHandleAttributes,
  dragHandleListeners,
}: TextQuestionCardProps) {
  const isLong = question.answerLength === 'long'

  return (
    <QuestionCardShell>
      <QuestionTitleField
        onChange={(value) => onChange({ ...question, question: value })}
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
        <LabeledToggle
          checked={isLong}
          chipClassName="bg-[#e8eeff] text-[#1e55c5]"
          className="w-[203px]"
          icon={<MessageSquareText size={15} />}
          label={isLong ? 'Long Answer' : 'Short Answer'}
          onCheckedChange={(checked) =>
            onChange({ ...question, answerLength: checked ? 'long' : 'short' })
          }
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

      {showAiAnalyze ? (
        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center">
          <span aria-hidden="true" />
          <MoveHandle
            attributes={dragHandleAttributes}
            className="justify-self-center"
            listeners={dragHandleListeners}
          />
          <AiAnalyzeLabel className="justify-self-end" />
        </div>
      ) : (
        <MoveHandle attributes={dragHandleAttributes} listeners={dragHandleListeners} />
      )}
    </QuestionCardShell>
  )
}
