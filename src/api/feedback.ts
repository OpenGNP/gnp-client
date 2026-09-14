import { apiPost } from '../lib/api'
import { getRespondentDeviceId } from '../lib/respondentDevice'

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
 * name attribution). A purely anonymous respondent sends none of that, so this
 * also attaches the browser's persisted `deviceId` — the server's only way to
 * recognise a repeat anonymous submission for "one response per person".
 */
export function submitFeedback(payload: SubmitFeedbackPayload): Promise<{ id: number }> {
  const deviceId = getRespondentDeviceId()
  return apiPost<{ id: number }>('/feedback', {
    ...payload,
    ...(deviceId ? { deviceId } : {}),
  })
}
