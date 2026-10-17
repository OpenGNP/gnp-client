import type { IndividualResponse } from '../../api/analytics'

/** "Somchai" when names are recorded and shown, else "Response #12". */
export function responseLabel(response: IndividualResponse, hideNames: boolean): string {
  return !hideNames && response.respondentName ? response.respondentName : `Response #${response.number}`
}
