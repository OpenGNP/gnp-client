import type { AxiosAdapter } from 'axios'

import { apiGet, getAuthToken, httpClient, setAuthToken } from '../src/lib/api'

function respondWith(headers: Record<string, string>): AxiosAdapter {
  return async (config) => ({
    data: { success: true, message: 'ok', data: null },
    status: 200,
    statusText: 'OK',
    headers,
    config,
  })
}

describe('auth token renewal header', () => {
  afterEach(() => setAuthToken(null))

  it('stores a renewed token sent back by the server', async () => {
    setAuthToken('old-token')
    httpClient.defaults.adapter = respondWith({ 'x-auth-token': 'new-token' })
    await apiGet('/users/me')
    expect(getAuthToken()).toBe('new-token')
  })

  it('ignores it once signed out', async () => {
    setAuthToken(null)
    httpClient.defaults.adapter = respondWith({ 'x-auth-token': 'new-token' })
    await apiGet('/users/me')
    expect(getAuthToken()).toBeNull()
  })
})
