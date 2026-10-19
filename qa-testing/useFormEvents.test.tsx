import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useFormEvents } from '../src/hooks/useFormEvents'

// A minimal EventSource that lets the test fire server events.
class FakeEventSource {
  static last: FakeEventSource | null = null
  static OPEN = 1
  readyState = 1
  url: string
  private handlers = new Map<string, () => void>()
  constructor(url: string) {
    this.url = url
    FakeEventSource.last = this
  }
  addEventListener(type: string, handler: () => void) {
    this.handlers.set(type, handler)
  }
  emit(type: string) {
    this.handlers.get(type)?.()
  }
  close() {}
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useFormEvents', () => {
  it('refetches what each event names, once per burst', () => {
    vi.useFakeTimers()
    vi.stubGlobal('EventSource', FakeEventSource)
    const client = new QueryClient()
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    renderHook(() => useFormEvents(4), { wrapper })

    expect(FakeEventSource.last?.url).toMatch(/\/forms\/4\/events$/)
    FakeEventSource.last!.emit('response')
    FakeEventSource.last!.emit('response')
    expect(invalidate).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1500)

    const keys = invalidate.mock.calls.map(([filters]) => JSON.stringify(filters?.queryKey))
    expect(keys).toEqual([
      JSON.stringify(['analytics', 4, 'responses']),
      JSON.stringify(['analytics', 4, 'individual']),
      JSON.stringify(['analytics', 4, 'themes']),
    ])
  })

  it('catches up once after reconnecting, not on the first open', () => {
    vi.stubGlobal('EventSource', FakeEventSource)
    const client = new QueryClient()
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    renderHook(() => useFormEvents(4), { wrapper })

    FakeEventSource.last!.emit('open')
    expect(invalidate).not.toHaveBeenCalled()
    FakeEventSource.last!.emit('open') // reconnected
    expect(invalidate.mock.calls.map(([filters]) => JSON.stringify(filters?.queryKey))).toEqual([
      JSON.stringify(['analytics', 4]),
      JSON.stringify(['form', 4]),
    ])
  })
})
