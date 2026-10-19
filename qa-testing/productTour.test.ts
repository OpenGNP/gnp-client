import { afterEach, describe, expect, it, vi } from 'vitest'

const drive = vi.fn()
const driverMock = vi.fn((_config: { steps: { element: string }[] }) => ({ drive }))
vi.mock('driver.js', () => ({ driver: (config: { steps: { element: string }[] }) => driverMock(config) }))
vi.mock('driver.js/dist/driver.css', () => ({}))

const { hasSeenTour, markTourSeen, startTour } = await import('../src/lib/productTour')

afterEach(() => {
  document.body.innerHTML = ''
  window.localStorage.clear()
  driverMock.mockClear()
})

describe('productTour', () => {
  it('remembers per user that a tour was seen', () => {
    expect(hasSeenTour('dashboard', 1)).toBe(false)
    markTourSeen('dashboard', 1)
    expect(hasSeenTour('dashboard', 1)).toBe(true)
    expect(hasSeenTour('dashboard', 2)).toBe(false)
  })

  it('skips steps whose element is not on the page', () => {
    document.body.innerHTML = '<div data-tour="a"></div>'
    startTour([
      { target: '[data-tour="a"]', title: 'A', text: '' },
      { target: '[data-tour="missing"]', title: 'B', text: '' },
    ])
    expect(driverMock.mock.calls[0]![0].steps.map((step) => step.element)).toEqual(['[data-tour="a"]'])
    expect(drive).toHaveBeenCalled()
  })

  it('does nothing when none of the steps are on the page', () => {
    startTour([{ target: '#nothing', title: 'X', text: '' }])
    expect(driverMock).not.toHaveBeenCalled()
  })
})
