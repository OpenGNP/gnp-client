import { describe, expect, it } from 'vitest'

import { demoResponsesCsv, filterDemoThemes } from '../src/components/dashboard/demoData'
import { SAMPLE_INDIVIDUAL, SAMPLE_THEMES } from '../src/data/sampleDashboard'

describe('filterDemoThemes', () => {
  it('leaves the sample untouched with no filter', () => {
    expect(filterDemoThemes(SAMPLE_THEMES, null, {})).toBe(SAMPLE_THEMES)
  })

  it('keeps only comments matching the demographic, scaling counts down', () => {
    const filtered = filterDemoThemes(SAMPLE_THEMES, null, { 'Year of study': ['Year 1'] })
    for (const topic of filtered.aiDiscoveredTopics) {
      expect(topic.feedbackSegment.length).toBeGreaterThan(0)
      for (const point of topic.feedbackSegment) {
        expect(point.demographics.find((d) => d.label === 'Year of study')?.value).toBe('Year 1')
      }
      const original = SAMPLE_THEMES.aiDiscoveredTopics.find((t) => t.id === topic.id)!
      expect(topic.negative).toBeLessThanOrEqual(original.negative)
    }
    expect(filtered.totalResponders).toBeLessThan(SAMPLE_THEMES.totalResponders)
    const shares = filtered.aiDiscoveredTopics.reduce((sum, t) => sum + t.percentOfTotal, 0)
    expect(Math.abs(shares - 100)).toBeLessThanOrEqual(filtered.aiDiscoveredTopics.length)
  })

  it('empties out under a range with no comments', () => {
    const filtered = filterDemoThemes(SAMPLE_THEMES, { from: '2020-01-01', to: '2020-01-02' }, {})
    expect(filtered.aiDiscoveredTopics).toEqual([])
    expect(filtered.totalResponders).toBe(0)
  })
})

describe('demoResponsesCsv', () => {
  it('writes a header and one row per response, quoting commas', async () => {
    const text = await demoResponsesCsv(SAMPLE_INDIVIDUAL, false).text()
    const lines = text.replace(/^\ufeff/, '').split('\r\n')
    expect(lines[0]).toBe('Response #,Submitted,Year of study,Program of study,Which facilities did you use this term?,Any other feedback?')
    expect(lines).toHaveLength(SAMPLE_INDIVIDUAL.responses.length + 1)
    expect(text).toContain('"More choices at the canteen this term, but prices are higher."')
  })
})
