import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

/**
 * One stop: the element to spotlight (a `[data-tour="…"]` selector) and what to say.
 * `interactive` lets the person try the spotlit element (only where that changes nothing lasting).
 */
export type TourStep = { target: string; title: string; text: string; interactive?: boolean }

const seenKey = (tour: string, userId: number) => `gnp.tour.${tour}.${userId}`

/** Shown once per person per browser — storage blocked counts as unseen, harmlessly. */
export function hasSeenTour(tour: string, userId: number): boolean {
  try {
    return window.localStorage.getItem(seenKey(tour, userId)) === '1'
  } catch {
    return false
  }
}

export function markTourSeen(tour: string, userId: number) {
  try {
    window.localStorage.setItem(seenKey(tour, userId), '1')
  } catch {
    // Storage blocked: it'll just show again next time.
  }
}

/**
 * Dims the page and walks through `steps`, spotlighting one element at a time. Steps
 * whose element isn't on screen (e.g. no topics yet) are skipped. `onEnd` runs when it
 * finishes or is closed, either way. Returns a handle to end it from outside.
 */
export function startTour(steps: TourStep[], onEnd?: () => void): { stop: () => void } | null {
  const present = steps.filter((step) => document.querySelector(step.target))
  if (present.length === 0) return null

  const tour = driver({
    steps: present.map((step) => ({
      element: step.target,
      popover: { title: step.title, description: step.text },
      disableActiveInteraction: !step.interactive,
    })),
    showProgress: true,
    progressText: '{{current}} of {{total}}',
    nextBtnText: 'Next',
    prevBtnText: 'Back',
    doneBtnText: 'Got it',
    overlayOpacity: 0.55,
    stagePadding: 6,
    stageRadius: 10,
    popoverClass: 'gnp-tour',
    // A stray click on the dimmed page shouldn't end it — use ✕ or Esc.
    overlayClickBehavior: 'none',
    onDestroyed: () => onEnd?.(),
  })
  tour.drive()
  return { stop: () => tour.destroy() }
}
