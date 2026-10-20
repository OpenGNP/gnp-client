import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useHeadroomHidden, useScrolledPastBar } from '../src/hooks/useHeadroom'

function scrollTo(y: number) {
  act(() => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: y })
    window.dispatchEvent(new Event('scroll'))
  })
}

describe('useHeadroomHidden', () => {
  it('hides scrolling down, shows on any scroll up, and always near the top', () => {
    scrollTo(0)
    const { result } = renderHook(() => useHeadroomHidden())
    expect(result.current).toBe(false)

    scrollTo(300)
    expect(result.current).toBe(true)
    scrollTo(303) // jitter under the threshold changes nothing
    expect(result.current).toBe(true)
    scrollTo(280)
    expect(result.current).toBe(false)
    scrollTo(600)
    expect(result.current).toBe(true)
    scrollTo(20)
    expect(result.current).toBe(false)
  })
})

describe('useScrolledPastBar', () => {
  it('floats from 120px and stays until back under 20px, so the shorter row cannot flicker', () => {
    scrollTo(0)
    const { result } = renderHook(() => useScrolledPastBar())
    scrollTo(100)
    expect(result.current).toBe(false)
    scrollTo(130)
    expect(result.current).toBe(true)
    scrollTo(60) // e.g. the browser compensating for the shorter row
    expect(result.current).toBe(true)
    scrollTo(10)
    expect(result.current).toBe(false)
  })
})
