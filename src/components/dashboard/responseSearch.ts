import type { IndividualResponse } from '../../api/analytics'
import { includesNeedle, snippetOf, toNeedle } from '../../lib/textSearch'

export type ResponseSearchResult = {
  response: IndividualResponse
  /** The answer the query was found in, trimmed around the match; null when only the label matched. */
  snippet: string | null
}

/**
 * Responses whose label or any answer contains `query` (case-insensitive substring —
 * works for Thai without word segmentation). Searching the label, not the raw name,
 * keeps hidden names unsearchable: with "Show names" off it's just "Response #12".
 */
export function searchResponses(
  responses: IndividualResponse[],
  labels: Map<number, string>,
  query: string,
): ResponseSearchResult[] {
  const needle = toNeedle(query)
  if (!needle) return responses.map((response) => ({ response, snippet: null }))

  return responses.flatMap((response): ResponseSearchResult[] => {
    for (const value of Object.values(response.answers).flat()) {
      const snippet = snippetOf(value, needle)
      if (snippet) return [{ response, snippet }]
    }
    return includesNeedle(labels.get(response.id), needle) ? [{ response, snippet: null }] : []
  })
}
