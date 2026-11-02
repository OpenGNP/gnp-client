import type { FormTrendAnalytics, WhatChangedRow } from '../src/data/dashboardAnalytics'
import { summarizeTrend } from '../src/lib/trendSummary'

const row = (id: string, kind: WhatChangedRow['kind'], violations = 0): WhatChangedRow => ({
  id,
  label: id,
  kind,
  share: { previous: 0, current: 0 },
  complaints: { previous: 0, current: 0 },
  violations,
  quote: null,
})

const trend = (overrides: Partial<FormTrendAnalytics>) =>
  ({
    bucket: 'week',
    volumeSeries: [{ label: '6 Oct' }, { label: '13 Oct' }],
    availableTopics: [{ id: '1', label: 'Shift swaps', mentions: 8, violations: 0 }],
    timelineEvents: [],
    whatChanged: null,
    ...overrides,
  }) as FormTrendAnalytics

describe('summarizeTrend', () => {
  it('counts What changed by group and adds up its violations', () => {
    const { comparison } = summarizeTrend(
      trend({
        whatChanged: {
          currentLabel: 'October',
          previousLabel: 'September',
          rows: [row('a', 'worse'), row('b', 'worse', 2), row('c', 'new'), row('d', 'better'), row('e', null, 1)],
        },
      }),
    )
    expect(comparison).toEqual({ current: 'October', previous: 'September', worse: 2, new: 1, violations: 3 })
  })

  it('names the biggest spike with its topic and period', () => {
    const { spike } = summarizeTrend(
      trend({
        timelineEvents: [
          { id: 's1', date: '2026-10-13', topicId: '1', bucketIndex: 1, count: 8, usual: 4 },
          { id: 's2', date: '2026-10-06', topicId: '1', bucketIndex: 0, count: 5, usual: 3 },
        ],
      }),
    )
    expect(spike).toEqual({ topicId: '1', label: 'Shift swaps', period: 'Week of 13 Oct', count: 8, usual: 4 })
  })

  it('has nothing to say without a comparison or spikes', () => {
    expect(summarizeTrend(trend({}))).toEqual({ comparison: null, spike: null })
  })
})
