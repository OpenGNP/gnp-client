import { describe, expect, it } from 'vitest'

import { fitWithin } from './resizeImage'

describe('fitWithin', () => {
  it('shrinks the long edge to the cap, keeping the aspect ratio', () => {
    expect(fitWithin(6000, 4000)).toEqual({ width: 2400, height: 1600 })
    expect(fitWithin(3000, 4000)).toEqual({ width: 1800, height: 2400 })
  })

  it('never enlarges a small image', () => {
    expect(fitWithin(800, 400)).toEqual({ width: 800, height: 400 })
  })
})
