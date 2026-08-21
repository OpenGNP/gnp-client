import type { DragEndEvent } from '@dnd-kit/core'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Circle, Type } from 'lucide-react'
import { useEffect, useState } from 'react'

import { AddQuestionButton } from './AddQuestionButton'
import { CoverImageField } from './CoverImageField'
import { createQuestion } from './question-types'
import type { Question, QuestionTypeOption, QuestionTypeValue } from './question-types'
import { SortableQuestionCard } from './SortableQuestionCard'

type FormSectionProps = {
  title: string
  questionTypes: QuestionTypeOption[]
  showAiAnalyze?: boolean
}

const dividerClass = 'h-px w-full bg-[#e8eaf1]'

const demographicQuestionTypes: QuestionTypeOption[] = [
  {
    value: 'choice',
    label: 'Choice',
    icon: (
      <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-[#1e55c5] bg-white text-[#1e55c5]">
        <Circle className="fill-current" size={10} strokeWidth={0} />
      </span>
    ),
  },
  { 
    value: 'text', 
    label: 'Text', 
    icon: (
      <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-xs border border-[#1e55c5] bg-white text-[#1e55c5]">
        <Type size={14} strokeWidth={3} />
      </span>
    ),
  },
]

const feedbackQuestionTypes: QuestionTypeOption[] = [
  { 
    value: 'text', 
    label: 'Text', 
    icon: (
      <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-xs border border-[#1e55c5] bg-white text-[#1e55c5]">
        <Type size={14} strokeWidth={3} />
      </span>
    ),
  },
]

function useQuestionSection() {
  const [questions, setQuestions] = useState<Question[]>([])

  const addQuestion = (type: QuestionTypeValue) => {
    setQuestions((previous) => [...previous, createQuestion(type, crypto.randomUUID())])
  }

  const updateQuestion = (updated: Question) => {
    setQuestions((previous) =>
      previous.map((question) => (question.id === updated.id ? updated : question)),
    )
  }

  const removeQuestion = (id: string) => {
    setQuestions((previous) => previous.filter((question) => question.id !== id))
  }

  const reorderQuestions = (activeId: string, overId: string) => {
    setQuestions((previous) => {
      const oldIndex = previous.findIndex((question) => question.id === activeId)
      const newIndex = previous.findIndex((question) => question.id === overId)
      if (oldIndex === -1 || newIndex === -1) {
        return previous
      }
      return arrayMove(previous, oldIndex, newIndex)
    })
  }

  return { questions, addQuestion, updateQuestion, removeQuestion, reorderQuestions }
}

function FormSection({ title, questionTypes, showAiAnalyze = false }: FormSectionProps) {
  const { questions, addQuestion, updateQuestion, removeQuestion, reorderQuestions } =
    useQuestionSection()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      reorderQuestions(String(active.id), String(over.id))
    }
  }

  return (
    <section className="flex flex-col gap-4" aria-labelledby={`${title}-title`}>
      <h2
        className="m-0 text-[32px] leading-[25.376px] font-semibold tracking-[0.32px] text-[#616161] max-[560px]:text-[28px]"
        id={`${title}-title`}
      >
        {title}
      </h2>

      {questions.length > 0 ? (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
          <SortableContext
            items={questions.map((question) => question.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex w-full flex-col gap-7.5">
              {questions.map((question) => (
                <SortableQuestionCard
                  key={question.id}
                  onChange={updateQuestion}
                  onDelete={() => removeQuestion(question.id)}
                  question={question}
                  showAiAnalyze={showAiAnalyze}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : null}

      <AddQuestionButton onAddQuestion={addQuestion} questionTypes={questionTypes} />
    </section>
  )
}

export function CreateFormCard() {
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (coverImageUrl) {
        URL.revokeObjectURL(coverImageUrl)
      }
    }
  }, [coverImageUrl])

  return (
    <section
      className="min-h-[657px] w-full max-w-[978px] overflow-hidden rounded-[10px] bg-white pt-15.25 pr-17.5 pb-28.75 pl-20 shadow-[0_1px_0_rgba(22,29,57,0.02)] max-[760px]:min-h-[560px] max-[760px]:px-6 max-[760px]:pt-9 max-[760px]:pb-12"
      aria-labelledby="create-form-title"
    >
      <div className="flex w-full flex-col gap-5">
        <CoverImageField
          imageUrl={coverImageUrl}
          onRemoveImage={() => setCoverImageUrl(null)}
          onSelectImage={(file) => setCoverImageUrl(URL.createObjectURL(file))}
        />

        <div className="flex flex-col gap-3">
          <input
            className="w-full border-0 bg-transparent p-0 text-[32px] leading-[25.376px] font-semibold tracking-[0.32px] text-[#616161] outline-none placeholder:text-[#616161] max-[560px]:text-[28px]"
            aria-label="Form title"
            defaultValue="Untitled form"
            id="create-form-title"
          />
          <textarea
            className="h-6 w-full resize-none border-0 bg-transparent p-0 text-[16px] leading-6 font-normal tracking-[0.16px] text-[#616161] outline-none placeholder:text-[#616161]"
            aria-label="Form description"
            defaultValue="Form description"
          />
        </div>

        <div className={dividerClass} />

        <FormSection questionTypes={demographicQuestionTypes} title="Demographic" />

        <div className={dividerClass} />

        <FormSection
          questionTypes={feedbackQuestionTypes}
          showAiAnalyze
          title="Feedback"
        />
      </div>
    </section>
  )
}
