import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

import { cn } from '../../lib/utils'
import { ChoiceQuestionCard } from './ChoiceQuestionCard'
import { QuestionPreviewCard } from './QuestionPreviewCard'
import type { Question } from './question-types'
import { TextQuestionCard } from './TextQuestionCard'

export type SortableQuestionCardProps = {
  question: Question
  onChange: (question: Question) => void
  onDelete: () => void
  showAiAnalyze?: boolean
  /** Being edited: the full card. Otherwise a compact preview that opens it on click. */
  isActive: boolean
  onActivate: () => void
}

export function SortableQuestionCard({
  question,
  onChange,
  onDelete,
  showAiAnalyze = false,
  isActive,
  onActivate,
}: SortableQuestionCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: question.id })

  return (
    <div
      className={cn('relative', isDragging && 'z-10 opacity-90')}
      // CreateFormCard closes the open card on a press anywhere outside this.
      data-active-question={isActive || undefined}
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <AnimatedHeight>
        {/* Keyed by state, so swapping preview ↔ editor remounts and fades the new one in. */}
        <div className="animate-in duration-200 fade-in-0 motion-reduce:animate-none" key={isActive ? 'edit' : 'preview'}>
          {!isActive ? (
            <QuestionPreviewCard
              dragHandleAttributes={attributes}
              dragHandleListeners={listeners}
              onActivate={onActivate}
              question={question}
              showAiAnalyze={showAiAnalyze}
            />
          ) : question.type === 'text' ? (
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
      </AnimatedHeight>
    </div>
  )
}

/**
 * Animates its height to follow its content (preview ↔ editor). The 6px padding inside,
 * cancelled by the margin outside, keeps the cards' shadows out of the clipped edge.
 */
function AnimatedHeight({ children }: { children: ReactNode }) {
  const innerRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number>()

  useLayoutEffect(() => {
    const inner = innerRef.current
    // No ResizeObserver (tests, very old browsers): plain auto height, no animation.
    if (!inner || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => setHeight(inner.offsetHeight))
    observer.observe(inner)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      className="-m-1.5 overflow-hidden transition-[height] duration-200 ease-out motion-reduce:transition-none"
      style={{ height }}
    >
      <div className="p-1.5" ref={innerRef}>
        {children}
      </div>
    </div>
  )
}
