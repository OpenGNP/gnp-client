import { sentimentSnapshot } from '../src/lib/sentimentTrendSummary'

const point = (label: string, negative: number, neutral: number, positive: number) => ({
  label,
  negative,
  neutral,
  positive,
})
const withCounts = (label: string, negative: number, neutral: number, positive: number) => {
  const total = negative + neutral + positive
  return {
    ...point(label, Math.round((negative / total) * 100), Math.round((neutral / total) * 100), 0),
    counts: { negative, neutral, positive },
  }
}

const series = [
  point('1 Sep', 0, 0, 0), // no feedback that week — skipped
  point('8 Sep', 30, 30, 40),
  point('15 Sep', 35, 30, 35),
  point('22 Sep', 45, 30, 25),
  point('29 Sep', 0, 0, 0),
]

describe('sentimentSnapshot', () => {
  it('describes the latest period with data, vs the first period with data', () => {
    expect(sentimentSnapshot(series)).toEqual({
      label: '22 Sep',
      shares: { negative: 45, neutral: 30, positive: 25 },
      counts: null,
      total: null,
      changes: { negative: 15, neutral: 0, positive: -15 },
      baselineLabel: '8 Sep',
    })
  })

  it('follows the hovered period', () => {
    expect(sentimentSnapshot(series, 2)?.label).toBe('15 Sep')
    expect(sentimentSnapshot(series, 2)?.changes).toEqual({ negative: 5, neutral: 0, positive: -5 })
  })

  it('has no comparison for the baseline itself or a single period', () => {
    expect(sentimentSnapshot(series, 1)?.changes).toBeNull()
    expect(sentimentSnapshot([point('8 Sep', 30, 30, 40)])?.changes).toBeNull()
  })

  it('is null with no data at all', () => {
    expect(sentimentSnapshot([point('1 Sep', 0, 0, 0)])).toBeNull()
  })
})

describe('sentimentSnapshot counts', () => {
  it('carries the raw counts so 100% of one mention can be told apart', () => {
    const snap = sentimentSnapshot([withCounts('8 Sep', 3, 2, 5), withCounts('15 Sep', 1, 0, 0)])
    expect(snap?.counts).toEqual({ negative: 1, neutral: 0, positive: 0 })
    expect(snap?.total).toBe(1)
  })
})
