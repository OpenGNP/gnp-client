import { Circle, Type } from 'lucide-react'
import { useEffect, useState } from 'react'

import { AddQuestionButton } from './AddQuestionButton'
import { ChoiceQuestionCard } from './ChoiceQuestionCard'
import { CoverImageField } from './CoverImageField'
import { createQuestion } from './question-types'
import type { Question, QuestionTypeOption, QuestionTypeValue } from './question-types'
import { TextQuestionCard } from './TextQuestionCard'

type FormSectionProps = {
  title: string
  questionTypes: QuestionTypeOption[]
}

const dividerClass = 'h-px w-full bg-[#e8eaf1]'

const demographicQuestionTypes: QuestionTypeOption[] = [
  {
    value: 'choice',
    label: 'Choice',
    icon: <Circle className="fill-current" size={16} strokeWidth={0} />,
  },
  { value: 'text', label: 'Text', icon: <Type size={16} /> },
]

const feedbackQuestionTypes: QuestionTypeOption[] = [
  { value: 'text', label: 'Text', icon: <Type size={16} /> },
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

  return { questions, addQuestion, updateQuestion, removeQuestion }
}

function FormSection({ title, questionTypes }: FormSectionProps) {
  const { questions, addQuestion, updateQuestion, removeQuestion } = useQuestionSection()

  return (
    <section className="flex flex-col gap-4" aria-labelledby={`${title}-title`}>
      <h2
        className="m-0 text-[32px] leading-10 font-semibold tracking-[0.32px] text-[#616161] max-[560px]:text-[28px]"
        id={`${title}-title`}
      >
        {title}
      </h2>

      {questions.length > 0 ? (
        <div className="flex w-full flex-col gap-7.5">
          {questions.map((question) =>
            question.type === 'text' ? (
              <TextQuestionCard
                key={question.id}
                onChange={updateQuestion}
                onDelete={() => removeQuestion(question.id)}
                question={question}
              />
            ) : (
              <ChoiceQuestionCard
                key={question.id}
                onChange={updateQuestion}
                onDelete={() => removeQuestion(question.id)}
                question={question}
              />
            ),
          )}
        </div>
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
            className="w-full border-0 bg-transparent p-0 text-[32px] leading-10 font-semibold tracking-[0.32px] text-[#616161] outline-none placeholder:text-[#616161] max-[560px]:text-[28px]"
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

        <FormSection questionTypes={feedbackQuestionTypes} title="Feedback" />
      </div>
    </section>
  )
}
