// CLI-U: response-state precedence draft → closed(end) → scheduled → closed(toggle) → open
import { describe, expect, it } from 'vitest'

import { deriveResponseState, formStatusBadge } from '@/lib/responseWindow'

const NOW = Date.parse('2026-06-15T12:00:00Z')
const base = { isPublished: true, acceptingResponses: true, startDate: null, endDate: null }

describe('deriveResponseState', () => {
  it('draft wins over everything', () => {
    expect(deriveResponseState({ ...base, isPublished: false, endDate: '2000-01-01T00:00:00Z' }, NOW)).toBe('draft')
  })
  it('open with no window', () => {
    expect(deriveResponseState(base, NOW)).toBe('open')
  })
  it('scheduled before start; open exactly at start', () => {
    expect(deriveResponseState({ ...base, startDate: '2026-06-15T12:00:01Z' }, NOW)).toBe('scheduled')
    expect(deriveResponseState({ ...base, startDate: '2026-06-15T12:00:00Z' }, NOW)).toBe('open')
  })
  it('closed after end; still open exactly at end', () => {
    expect(deriveResponseState({ ...base, endDate: '2026-06-15T11:59:59Z' }, NOW)).toBe('closed')
    expect(deriveResponseState({ ...base, endDate: '2026-06-15T12:00:00Z' }, NOW)).toBe('open')
  })
  it('manual toggle off → closed, but window end still takes precedence in label', () => {
    expect(deriveResponseState({ ...base, acceptingResponses: false }, NOW)).toBe('closed')
  })
  it('a window that has not started stays scheduled even if the toggle is off', () => {
    expect(deriveResponseState({ ...base, acceptingResponses: false, startDate: '2027-01-01T00:00:00Z' }, NOW)).toBe('scheduled')
  })
})

describe('formStatusBadge', () => {
  const win = { acceptingResponses: true, startDate: null, endDate: null }
  it('maps lifecycle statuses', () => {
    expect(formStatusBadge('archived', win, NOW).label).toBe('Archived')
    expect(formStatusBadge('closed', win, NOW).label).toBe('Closed')
    expect(formStatusBadge('draft', win, NOW).label).toBe('Draft')
    expect(formStatusBadge(null, win, NOW).label).toBe('Draft')
  })
  it('active defers to the live response state', () => {
    expect(formStatusBadge('active', win, NOW).label).toBe('Open')
    expect(formStatusBadge('active', { ...win, startDate: '2027-01-01T00:00:00Z' }, NOW).label).toBe('Scheduled')
    expect(formStatusBadge('active', { ...win, acceptingResponses: false }, NOW).detail).toBe('Not accepting responses')
  })
})
