import {
  sentimentBands,
  sharesOf,
  sumSentiment,
  topicSentimentPoints,
} from '../src/lib/sentimentTrendSummary'

describe('sentiment helpers', () => {
  it('sums counts across periods, skipping missing ones', () => {
    expect(
      sumSentiment([
        { negative: 1, neutral: 2, positive: 3 },
        undefined,
        { negative: 4, neutral: 0, positive: 1 },
      ]),
    ).toEqual({ negative: 5, neutral: 2, positive: 4 })
  })

  it('turns counts into shares that add up to 100', () => {
    expect(sharesOf({ negative: 1, neutral: 1, positive: 1 })).toEqual({
      negative: 33,
      neutral: 33,
      positive: 34,
    })
    expect(sharesOf({ negative: 0, neutral: 0, positive: 0 })).toEqual({
      negative: 0,
      neutral: 0,
      positive: 0,
    })
  })

  it("builds a topic's per-period points with counts", () => {
    expect(
      topicSentimentPoints(['W1', 'W2'], [
        { negative: 3, neutral: 0, positive: 1 },
        { negative: 0, neutral: 0, positive: 0 },
      ]),
    ).toEqual([
      { label: 'W1', negative: 75, neutral: 0, positive: 25, counts: { negative: 3, neutral: 0, positive: 1 } },
      { label: 'W2', negative: 0, neutral: 0, positive: 0, counts: { negative: 0, neutral: 0, positive: 0 } },
    ])
  })

  it('draws bands as ranges and leaves empty periods as gaps (not a drop to 0)', () => {
    expect(
      sentimentBands([
        { label: 'W1', negative: 30, neutral: 30, positive: 40 },
        { label: 'W2', negative: 0, neutral: 0, positive: 0 },
      ]),
    ).toEqual([
      { label: 'W1', positive: [0, 40], neutral: [40, 70], negative: [70, 100] },
      { label: 'W2', positive: null, neutral: null, negative: null },
    ])
  })
})
