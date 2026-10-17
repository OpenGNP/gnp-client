import { describe, expect, it } from 'vitest'

import type { IndividualResponse } from '../src/api/analytics'
import { responseLabels } from '../src/components/dashboard/responseLabel'

const response = (id: number, name: string | null): IndividualResponse => ({
  id,
  number: id,
  submittedAt: null,
  respondentName: name,
  answers: {},
})

// Newest first, as the API returns them.
const responses = [response(4, 'Ann'), response(3, null), response(2, 'Bob'), response(1, 'Ann')]

describe('responseLabels', () => {
  it('numbers a repeat respondent in submission order, leaves one-time names bare', () => {
    expect([...responseLabels(responses, false)]).toEqual([
      [4, 'Ann (2)'],
      [3, 'Response #3'],
      [2, 'Bob'],
      [1, 'Ann (1)'],
    ])
  })

  it('falls back to response numbers when names are hidden', () => {
    expect(responseLabels(responses, true).get(4)).toBe('Response #4')
  })
})
