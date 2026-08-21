import { Plus, X } from 'lucide-react'
import { useState } from 'react'

import { cn } from '../../lib/utils'
import type { QuestionTypeOption, QuestionTypeValue } from './question-types'

export type AddQuestionButtonProps = {
  questionTypes: QuestionTypeOption[]
  onAddQuestion: (type: QuestionTypeValue) => void
}

export function AddQuestionButton({
  questionTypes,
  onAddQuestion,
}: AddQuestionButtonProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="flex w-full flex-col items-start gap-5">
      <button
        className="inline-flex cursor-pointer items-center gap-2.5 rounded-[11px] border-0 bg-transparent px-2.5 py-2.5 text-[16px] tracking-[0.16px] text-[#1e55c5] transition-colors hover:bg-[#f7f8fb] focus-visible:ring-2 focus-visible:ring-[#1e55c5]/40 focus-visible:outline-none"
        aria-expanded={isMenuOpen}
        onClick={() => setIsMenuOpen((open) => !open)}
        type="button"
      >
        <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[#1e55c5] text-white">
          {isMenuOpen ? (
            <X size={16} strokeWidth={2.5} />
          ) : (
            <Plus size={16} strokeWidth={2.5} />
          )}
        </span>
        <span>Add new question</span>
      </button>

      {isMenuOpen ? (
        <div className="flex w-full flex-wrap items-center gap-4" role="menu">
          {questionTypes.map((questionType) => (
            <button
              key={questionType.value}
              className={cn(
                'flex w-full max-w-100.75 cursor-pointer items-center gap-2.5 rounded-[10px] border border-[#d7dce8] bg-[#f7f8fb] px-5 py-3.75 text-[16px] tracking-[0.16px] text-black transition-colors hover:border-[#1e55c5]/50 hover:bg-white',
              )}
              onClick={() => {
                onAddQuestion(questionType.value)
                setIsMenuOpen(false)
              }}
              role="menuitem"
              type="button"
            >
              <span className="shrink-0 text-[#3f4045]">{questionType.icon}</span>
              <span>{questionType.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
