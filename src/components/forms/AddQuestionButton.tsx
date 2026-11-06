import { Plus, Sparkles } from 'lucide-react'

import { QUESTION_USE, type QuestionTypeOption, type QuestionTypeValue } from './question-types'

export type AddQuestionButtonProps = {
  questionTypes: QuestionTypeOption[]
  onAddQuestion: (type: QuestionTypeValue) => void
  /** In the AI-analysed (feedback) section: hints say what AI does. */
  analysed?: boolean
}

/** One button per question type, each saying what happens to its answers. */
export function AddQuestionButton({ questionTypes, onAddQuestion, analysed = false }: AddQuestionButtonProps) {
  return (
    <div className="flex w-full flex-wrap items-center gap-3">
      {questionTypes.map((questionType) => (
        <button
          key={questionType.value}
          className="inline-flex cursor-pointer items-center gap-2.5 rounded-[10px] border border-[#d7dce8] bg-[#f7f8fb] px-4 py-2.5 text-[16px] tracking-[0.16px] text-black transition-colors hover:border-[#1e55c5]/50 hover:bg-white focus-visible:ring-2 focus-visible:ring-[#1e55c5]/40 focus-visible:outline-none"
          onClick={() => onAddQuestion(questionType.value)}
          type="button"
        >
          <Plus className="text-[#1e55c5]" size={18} strokeWidth={2.5} />
          <span className="shrink-0">{questionType.icon}</span>
          {questionType.label}
          {analysed && questionType.value === 'text' ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#e8eeff] px-2 py-0.5 text-[12px] text-[#1e55c5]">
              <Sparkles size={12} />
              {QUESTION_USE.feedback.text[1]}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  )
}
