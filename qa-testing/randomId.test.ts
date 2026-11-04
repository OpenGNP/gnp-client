// CLI-U: HTTP-origin safety (QA_PLAN 1.9) — no crash when crypto.randomUUID is absent
import { afterEach, describe, expect, it, vi } from 'vitest'

import { randomId } from '@/lib/randomId'
import { getRespondentDeviceId } from '@/lib/respondentDevice'

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

afterEach(() => {
  vi.unstubAllGlobals()
  window.localStorage.clear()
})

describe('randomId', () => {
  it('uses crypto.randomUUID when available', () => {
    expect(randomId()).toMatch(UUID_V4)
  })
  it('falls back to getRandomValues when randomUUID is missing (insecure context)', () => {
    vi.stubGlobal('crypto', { getRandomValues: crypto.getRandomValues.bind(crypto) })
    expect(randomId()).toMatch(UUID_V4)
  })
  it('falls back to Math.random when crypto is missing entirely', () => {
    vi.stubGlobal('crypto', undefined)
    expect(randomId()).toMatch(UUID_V4)
  })
  it('is unique across calls', () => {
    expect(new Set(Array.from({ length: 200 }, randomId)).size).toBe(200)
  })
})

describe('getRespondentDeviceId', () => {
  it('persists and reuses one id', () => {
    const first = getRespondentDeviceId()
    expect(first).toBeTruthy()
    expect(getRespondentDeviceId()).toBe(first)
  })
  it('works without crypto.randomUUID (http origin)', () => {
    vi.stubGlobal('crypto', { getRandomValues: crypto.getRandomValues.bind(crypto) })
    expect(getRespondentDeviceId()).toMatch(UUID_V4)
  })
  it('returns null when localStorage throws (private mode)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    expect(getRespondentDeviceId()).toBeNull()
    vi.restoreAllMocks()
  })
})
