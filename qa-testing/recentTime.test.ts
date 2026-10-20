import { describe, expect, it } from 'vitest'

import { recency, recentTime } from '../src/lib/recentTime'

describe('recentTime', () => {
  it('uses whichever is later, opened or modified, and says which', () => {
    expect(recentTime({ lastOpenedAt: '2026-10-18T00:00:00Z', updatedAt: '2026-09-01T00:00:00Z' })).toEqual({
      label: 'Opened',
      at: '2026-10-18T00:00:00Z',
    })
    expect(recentTime({ lastOpenedAt: '2026-09-01T00:00:00Z', updatedAt: '2026-10-18T00:00:00Z' })).toEqual({
      label: 'Modified',
      at: '2026-10-18T00:00:00Z',
    })
  })

  it('falls back to created for a form never opened or edited', () => {
    expect(recentTime({ lastOpenedAt: null, updatedAt: null, createdAt: '2026-10-01T00:00:00Z' })).toEqual({
      label: 'Modified',
      at: '2026-10-01T00:00:00Z',
    })
    expect(recency({})).toBe(0)
  })
})
