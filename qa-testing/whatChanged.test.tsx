import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TrendView } from '../src/components/dashboard/TrendView'
import type { FormTrendAnalytics, WhatChangedRow } from '../src/data/dashboardAnalytics'

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const row = (id: string, kind: WhatChangedRow['kind'], violations = 0): WhatChangedRow => ({
  id,
  label: `Topic ${id}`,
  kind,
  share: { previous: 8, current: 14 },
  complaints: { previous: 40, current: 75 },
  violations,
  quote: kind === 'better' ? null : `Quote ${id}`,
  complaintCounts: { previous: { negative: 2, total: 5 }, current: { negative: 3, total: 4 } },
})

const base: FormTrendAnalytics = {
  bucket: 'month',
  rank: 'mentioned',
  from: '',
  to: '',
  rangeLabel: '',
  totalMentions: 10,
  topicVolumeSeries: [],
  availableTopics: [],
  volumeSeries: [],
  topicSentimentSeries: {},
  topicSummaries: [],
  sentimentSeries: [],
  whatChanged: { currentLabel: 'Aug 2026', previousLabel: 'Jul 2026', rows: [row('1', 'worse', 2), row('2', 'better')] },
  timelineEvents: [],
}

const noop = () => {}

describe('What changed', () => {
  it('reads each row as a sentence, with the violation badge and a quote', () => {
    render(<TrendView onPinnedChange={noop} pinned={null} trend={base} />)
    expect(screen.getByText('Aug 2026 compared with Jul 2026')).toBeInTheDocument()
    expect(screen.getAllByText('40% → 75%')).toHaveLength(2) // under each complaints dumbbell
    expect(screen.getByText('2 possible violations')).toBeInTheDocument()
    expect(screen.getByText('“Quote 1”')).toBeInTheDocument()
    expect(screen.queryByText('“Quote 2”')).not.toBeInTheDocument()
  })

  it("hovering the complaints dumbbell shows the counts behind the %", async () => {
    render(<TrendView onPinnedChange={noop} pinned={null} trend={base} />)
    await userEvent.hover(screen.getAllByText('40% → 75%')[0]!)
    expect((await screen.findAllByText('Now: 3 of 4 mentions (75%)')).length).toBeGreaterThan(0)
  })

  it('clicking a row selects that topic', async () => {
    const onTopicSelect = vi.fn()
    render(<TrendView onPinnedChange={noop} onTopicSelect={onTopicSelect} pinned={null} trend={base} />)
    await userEvent.click(screen.getByText('Topic 2'))
    expect(onTopicSelect).toHaveBeenCalledWith('2')
  })

  it('"View feedback" opens the topic instead of charting it', async () => {
    const onTopicSelect = vi.fn()
    const onTopicOpen = vi.fn()
    render(
      <TrendView onPinnedChange={noop} onTopicOpen={onTopicOpen} onTopicSelect={onTopicSelect} pinned={null} trend={base} />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'View feedback for Topic 1' }))
    expect(onTopicOpen).toHaveBeenCalledWith('1')
    expect(onTopicSelect).not.toHaveBeenCalled()
  })

  it('shows five rows until "Show all"', async () => {
    const rows = [1, 2, 3, 4, 5, 6, 7].map((i) => row(String(i), 'worse'))
    render(<TrendView onPinnedChange={noop} pinned={null} trend={{ ...base, whatChanged: { ...base.whatChanged!, rows } }} />)
    expect(screen.queryByText('Topic 6')).not.toBeInTheDocument()
    await userEvent.click(screen.getByText('Show all 7'))
    expect(screen.getByText('Topic 7')).toBeInTheDocument()
  })

  it('one line when nothing moved, or when there is no comparison', () => {
    const { rerender } = render(
      <TrendView onPinnedChange={noop} pinned={null} trend={{ ...base, whatChanged: { ...base.whatChanged!, rows: [] } }} />,
    )
    expect(screen.getByText('No big changes since Jul 2026')).toBeInTheDocument()
    rerender(<TrendView onPinnedChange={noop} pinned={null} trend={{ ...base, whatChanged: null }} />)
    expect(screen.getByText(/Not enough feedback yet/)).toBeInTheDocument()
  })
})
