import type { IndividualField, IndividualResponse } from '../../api/analytics'

/**
 * The page's date range and demographic filter applied to the Individual list, matching the
 * server's rules (loadDemographics): questions by title, a blank answer counts as "Unspecified",
 * and within one question any chosen answer matches.
 */
export function filterResponses(
  responses: IndividualResponse[],
  fields: IndividualField[],
  range: { from: string; to: string } | null,
  demo: Record<string, string[]>,
): IndividualResponse[] {
  const from = range ? Date.parse(range.from) : -Infinity
  const to = range ? Date.parse(range.to) : Infinity
  const chosen = Object.entries(demo).filter(([, values]) => values.length > 0)
  const fieldByTitle = new Map(
    fields.filter((field) => field.section === 'demographic').map((field) => [field.title, field]),
  )
  return responses.filter((response) => {
    if (range) {
      const at = Date.parse(response.submittedAt ?? '')
      if (!(at >= from && at <= to)) return false
    }
    return chosen.every(([title, values]) => {
      const field = fieldByTitle.get(title)
      const answers = field ? (response.answers[field.id] ?? []) : []
      return (answers.length > 0 ? answers : ['Unspecified']).some((answer) => values.includes(answer))
    })
  })
}
