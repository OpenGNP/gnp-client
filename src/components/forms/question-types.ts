import type { ReactNode } from 'react'

export type QuestionTypeValue = 'choice' | 'text'

export type QuestionTypeOption = {
  value: QuestionTypeValue
  label: string
  icon: ReactNode
}

export type TextQuestion = {
  id: string
  type: 'text'
  question: string
  answerLength: 'short' | 'long'
  required: boolean
}

export type ChoiceQuestion = {
  id: string
  type: 'choice'
  question: string
  options: string[]
  allowMultiple: boolean
  hasOther: boolean
  required: boolean
}

export type Question = TextQuestion | ChoiceQuestion

export function createQuestion(type: QuestionTypeValue, id: string): Question {
  if (type === 'choice') {
    return {
      id,
      type: 'choice',
      question: '',
      options: [''],
      allowMultiple: false,
      hasOther: false,
      required: true,
    }
  }

  return {
    id,
    type: 'text',
    question: '',
    answerLength: 'short',
    required: true,
  }
}

/** What happens to a question's answers: [long, short] copy per section and type; null shows nothing. */
export const QUESTION_USE = {
  feedback: { text: ['AI groups answers into topics', 'AI topics'], choice: null },
  // Explained once by the section's ⓘ (SectionInfo in CreateFormCard) instead.
  demographic: { text: null, choice: null },
} as const
