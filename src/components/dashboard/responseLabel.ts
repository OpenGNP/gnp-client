import type { IndividualResponse } from '../../api/analytics'

/**
 * Each response's display name: the respondent's name when recorded and shown, else
 * "Response #12". Someone who answered more than once gets "Somchai (1)", "Somchai (2)", …
 * in the order they submitted.
 */
export function responseLabels(responses: IndividualResponse[], hideNames: boolean): Map<number, string> {
  const byName = new Map<string, IndividualResponse[]>()
  for (const response of hideNames ? [] : responses) {
    if (!response.respondentName) continue
    byName.set(response.respondentName, [...(byName.get(response.respondentName) ?? []), response])
  }

  const labels = new Map<number, string>()
  for (const response of responses) {
    labels.set(response.id, `Response #${response.number}`)
  }
  for (const [name, own] of byName) {
    const oldestFirst = [...own].sort((a, b) => a.number - b.number)
    oldestFirst.forEach((response, index) => {
      labels.set(response.id, oldestFirst.length > 1 ? `${name} (${index + 1})` : name)
    })
  }
  return labels
}
