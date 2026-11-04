// CLI-U: axios client — envelope unwrap, ApiError mapping, Bearer header, token storage
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { ApiError, apiGet, apiPost, getAuthToken, httpClient, setAuthToken } from '@/lib/api'

let lastConfig: InternalAxiosRequestConfig | undefined
const respond = (status: number, body: unknown): AxiosAdapter => async (config) => {
  lastConfig = config
  const response = { data: body, status, statusText: '', headers: {}, config }
  if (status >= 400) {
    const { AxiosError } = await import('axios')
    throw new AxiosError('boom', String(status), config, null, response)
  }
  return response
}

beforeEach(() => {
  lastConfig = undefined
  setAuthToken(null)
})
afterEach(() => {
  setAuthToken(null)
})

describe('api client', () => {
  it('unwraps { success, data }', async () => {
    httpClient.defaults.adapter = respond(200, { success: true, message: 'ok', data: { id: 1 } })
    expect(await apiGet('/x')).toEqual({ id: 1 })
  })
  it('success:false on a 200 throws ApiError with the server message', async () => {
    httpClient.defaults.adapter = respond(200, { success: false, message: 'nope' })
    await expect(apiGet('/x')).rejects.toMatchObject({ name: 'ApiError', message: 'nope', status: 200 })
  })
  it('HTTP errors surface server message + status', async () => {
    httpClient.defaults.adapter = respond(409, { success: false, message: 'You have already submitted a response to this form' })
    const err = await apiPost('/feedback', {}).catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(409)
    expect(err.message).toContain('already submitted')
  })
  it('network error (no response) → ApiError status 0', async () => {
    httpClient.defaults.adapter = async (config) => {
      const { AxiosError } = await import('axios')
      throw new AxiosError('Network Error', 'ERR_NETWORK', config)
    }
    await expect(apiGet('/x')).rejects.toMatchObject({ status: 0 })
  })
  it('sends Bearer only when a token is set', async () => {
    httpClient.defaults.adapter = respond(200, { success: true, message: '', data: null })
    await apiGet('/x')
    expect(lastConfig?.headers.get('Authorization')).toBeFalsy()
    setAuthToken('abc')
    await apiGet('/x')
    expect(lastConfig?.headers.get('Authorization')).toBe('Bearer abc')
  })
  it('setAuthToken persists to and clears localStorage', () => {
    setAuthToken('abc')
    expect(window.localStorage.getItem('gnp.auth.token')).toBe('abc')
    expect(getAuthToken()).toBe('abc')
    setAuthToken(null)
    expect(window.localStorage.getItem('gnp.auth.token')).toBeNull()
  })
})
