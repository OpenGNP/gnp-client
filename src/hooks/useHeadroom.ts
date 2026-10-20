import { useSyncExternalStore } from 'react'

/** The Edit form | Dashboard bar's height: hiding slides it up by exactly this. */
export const HEADROOM_BAR_HEIGHT = 50
// Ignore smaller moves, so a finger's jitter doesn't flicker the bar.
const THRESHOLD = 6

let hidden = false
let lastY = 0
const listeners = new Set<() => void>()

function onScroll() {
  const y = window.scrollY
  const nearTop = y <= HEADROOM_BAR_HEIGHT
  if (!nearTop && Math.abs(y - lastY) < THRESHOLD) return
  const next = !nearTop && y > lastY
  lastY = y
  if (next !== hidden) {
    hidden = next
    listeners.forEach((listener) => listener())
  }
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) {
    lastY = window.scrollY
    window.addEventListener('scroll', onScroll, { passive: true })
  }
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      window.removeEventListener('scroll', onScroll)
      hidden = false
    }
  }
}

// Floating starts further down than it ends: the row gets shorter when it floats, the
// browser shifts the scroll to compensate, and one threshold would flip it back and forth.
const FLOAT_FROM = 120
const FLOAT_UNTIL = 20

let floating = false
const floatListeners = new Set<() => void>()

function onFloatScroll() {
  const y = window.scrollY
  const next = floating ? y > FLOAT_UNTIL : y > FLOAT_FROM
  if (next !== floating) {
    floating = next
    floatListeners.forEach((listener) => listener())
  }
}

function subscribeFloat(listener: () => void) {
  if (floatListeners.size === 0) {
    floating = window.scrollY > FLOAT_FROM
    window.addEventListener('scroll', onFloatScroll, { passive: true })
  }
  floatListeners.add(listener)
  return () => {
    floatListeners.delete(listener)
    if (floatListeners.size === 0) window.removeEventListener('scroll', onFloatScroll)
  }
}

/** Scrolled well past the tabs bar: the sticky rows now float over the page. */
export function useScrolledPastBar() {
  return useSyncExternalStore(
    subscribeFloat,
    () => floating,
    () => false,
  )
}

/**
 * "Headroom": true while scrolling down (the bar gets out of the way), false again on
 * any scroll up or near the top. One shared state, so the bar and the detail panel
 * below it always agree.
 */
export function useHeadroomHidden() {
  return useSyncExternalStore(
    subscribe,
    () => hidden,
    () => false,
  )
}
