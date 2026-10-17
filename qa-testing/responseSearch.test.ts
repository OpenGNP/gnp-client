import { describe, expect, it } from 'vitest'

import type { IndividualResponse } from '../src/api/analytics'
import { responseLabels } from '../src/components/dashboard/responseLabel'
import { searchResponses } from '../src/components/dashboard/responseSearch'

const response = (id: number, name: string | null, answers: Record<string, string[]>): IndividualResponse => ({
  id,
  number: id,
  submittedAt: null,
  respondentName: name,
  answers,
})

const responses = [
  response(2, 'Somchai', { 1: ['Year 2'], 2: ['แอร์ในห้องเรียนเย็นเกินไป'] }),
  response(1, null, { 1: ['Year 4'], 2: ['WiFi drops in the library'] }),
]

const ids = (query: string, hideNames = false) =>
  searchResponses(responses, responseLabels(responses, hideNames), query).map((result) => result.response.id)

describe('searchResponses', () => {
  it('returns everything for an empty query', () => {
    expect(ids('  ')).toEqual([2, 1])
  })

  it('matches answers case-insensitively, Thai included, with a snippet', () => {
    expect(ids('wifi')).toEqual([1])
    expect(ids('แอร์')).toEqual([2])
    const [result] = searchResponses(responses, responseLabels(responses, false), 'wifi')
    expect(result?.snippet).toBe('WiFi drops in the library')
  })

  it('matches names only while they are shown', () => {
    expect(ids('somchai')).toEqual([2])
    expect(ids('somchai', true)).toEqual([])
    expect(ids('response #1', true)).toEqual([1])
  })
})

describe('textSearch', () => {
  it('matches trimmed, case-insensitive substrings', async () => {
    const { includesNeedle, toNeedle } = await import('../src/lib/textSearch')
    expect(includesNeedle('แอร์ในห้องเรียน', toNeedle('  ห้อง '))).toBe(true)
    expect(includesNeedle('WiFi', toNeedle('wifi'))).toBe(true)
    expect(includesNeedle(null, toNeedle('x'))).toBe(false)
  })
})
