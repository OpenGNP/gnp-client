import type { IndividualField, IndividualResponse } from '../src/api/analytics'
import { filterResponses } from '../src/components/dashboard/responseFilter'

const fields: IndividualField[] = [
  { id: 1, title: 'Department', section: 'demographic', type: 'radio' },
  { id: 2, title: 'Any other feedback?', section: 'feedback', type: 'textarea' },
]
const response = (id: number, day: number, department?: string): IndividualResponse => ({
  id,
  number: id,
  submittedAt: `2026-10-${String(day).padStart(2, '0')}T09:00:00.000Z`,
  respondentName: null,
  answers: department ? { 1: [department] } : {},
})
const all = [response(1, 1, 'Finance'), response(2, 10, 'Warehouse'), response(3, 20)]
const ids = (list: IndividualResponse[]) => list.map((r) => r.id)

describe('filterResponses', () => {
  it('keeps everything with no filters', () => {
    expect(ids(filterResponses(all, fields, null, {}))).toEqual([1, 2, 3])
  })

  it('keeps responses inside the date range', () => {
    const range = { from: '2026-10-05T00:00:00.000Z', to: '2026-10-15T23:59:59.999Z' }
    expect(ids(filterResponses(all, fields, range, {}))).toEqual([2])
  })

  it('matches any chosen answer, and a blank answer as Unspecified', () => {
    expect(ids(filterResponses(all, fields, null, { Department: ['Finance', 'Unspecified'] }))).toEqual([1, 3])
    expect(ids(filterResponses(all, fields, null, { Department: [] }))).toEqual([1, 2, 3])
  })
})
