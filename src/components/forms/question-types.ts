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
      allowMultiple: true,
      hasOther: false,
      required: false,
    }
  }

  return {
    id,
    type: 'text',
    question: '',
    answerLength: 'long',
    required: false,
  }
}
