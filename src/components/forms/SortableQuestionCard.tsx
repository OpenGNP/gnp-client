import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { cn } from '../../lib/utils'
import { ChoiceQuestionCard } from './ChoiceQuestionCard'
import type { Question } from './question-types'
import { TextQuestionCard } from './TextQuestionCard'

export type SortableQuestionCardProps = {
  question: Question
  onChange: (question: Question) => void
  onDelete: () => void
  showAiAnalyze?: boolean
}

export function SortableQuestionCard({
  question,
  onChange,
  onDelete,
  showAiAnalyze = false,
}: SortableQuestionCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: question.id })

  return (
    <div
      className={cn('relative', isDragging && 'z-10 opacity-90')}
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      {question.type === 'text' ? (
        <TextQuestionCard
          dragHandleAttributes={attributes}
          dragHandleListeners={listeners}
          onChange={onChange}
          onDelete={onDelete}
          question={question}
          showAiAnalyze={showAiAnalyze}
        />
      ) : (
        <ChoiceQuestionCard
          dragHandleAttributes={attributes}
          dragHandleListeners={listeners}
          onChange={onChange}
          onDelete={onDelete}
          question={question}
        />
      )}
    </div>
  )
}
