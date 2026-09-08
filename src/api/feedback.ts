import { apiPost } from '../lib/api'

export type FeedbackAnswerPayload = {
  fieldId: number
  answerText?: string
  answerOptionId?: number
}

export type SubmitFeedbackPayload = {
  formId: number
  answers: FeedbackAnswerPayload[]
}

/**
 * `POST /api/feedback` — submit a form response. The auth token, if one is stored,
 * is attached automatically (org/specific-access checks, one-response-per-person,
 * name attribution); a purely anonymous respondent sends none.
 */
export function submitFeedback(payload: SubmitFeedbackPayload): Promise<{ id: number }> {
  return apiPost<{ id: number }>('/feedback', payload)
}
