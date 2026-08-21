import { Asterisk, MessageSquareText } from 'lucide-react'

import { cn } from '../../lib/utils'
import {
  AiAnalyzeButton,
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
}

export function TextQuestionCard({
  question,
  onChange,
  onDelete,
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

      <div className="flex w-full items-center justify-center gap-4">
        <AiAnalyzeButton />
        <MoveHandle />
      </div>
    </QuestionCardShell>
  )
}
