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
// The counts are split across spans (negative count is coloured), so match on the whole text.
const counts = () => screen.getAllByText((_, el) => el?.tagName === 'SPAN' && el.textContent === '2/5 → 3/4').at(-1)!

describe('What changed', () => {
  it('reads each row as a sentence, with the violation badge and a quote', () => {
    render(<TrendView onPinnedChange={noop} pinned={null} trend={base} />)
    expect(screen.getAllByText('Aug 2026 vs Jul 2026').length).toBeGreaterThan(0)
    // Under the complaints dumbbell: the counts (the dots already show the %).
    expect(counts()).toBeInTheDocument()
    expect(screen.getAllByText('2 possible violations').length).toBeGreaterThan(0)
    expect(screen.getByText('“Quote 1”')).toBeInTheDocument()
    expect(screen.queryByText('“Quote 2”')).not.toBeInTheDocument()
  })

  it("hovering the complaints dumbbell shows the counts behind the %", async () => {
    render(<TrendView onPinnedChange={noop} pinned={null} trend={base} />)
    await userEvent.hover(counts())
    expect((await screen.findAllByText('Now: 3 of 4 mentions (75%)')).length).toBeGreaterThan(0)
  })

  it('clicking a row selects that topic', async () => {
    const onTopicSelect = vi.fn()
    render(<TrendView onPinnedChange={noop} onTopicSelect={onTopicSelect} pinned={null} trend={base} />)
    await userEvent.click(screen.getByText('Topic 1'))
    expect(onTopicSelect).toHaveBeenCalledWith('1')
  })

  it('Improving starts folded; opening it shows its topics', async () => {
    render(<TrendView onPinnedChange={noop} pinned={null} trend={base} />)
    expect(screen.queryByText('Topic 2')).not.toBeInTheDocument()
    await userEvent.click(screen.getByText('Improving'))
    expect(screen.getByText('Topic 2')).toBeInTheDocument()
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

  it('groups rows by what to act on, in a fixed order', () => {
    const rows = [row('b', 'better'), row('n', 'new'), row('w', 'worse'), row('s', null, 1)]
    render(<TrendView onPinnedChange={noop} pinned={null} trend={{ ...base, whatChanged: { ...base.whatChanged!, rows } }} />)
    const headings = screen.getAllByText(/^(Getting worse|New topics|Improving|Flagged, no clear change)$/)
    expect(headings.map((h) => h.textContent?.replace(/\d+$/, ''))).toEqual(['Getting worse', 'New topics', 'Improving', 'Flagged, no clear change'])
  })

  it('the flagged-only group starts folded', async () => {
    const rows = [row('w', 'worse'), row('s', null, 1)]
    render(<TrendView onPinnedChange={noop} pinned={null} trend={{ ...base, whatChanged: { ...base.whatChanged!, rows } }} />)
    expect(screen.queryByText('Topic s')).not.toBeInTheDocument()
    await userEvent.click(screen.getByText('Flagged, no clear change'))
    expect(screen.getByText('Topic s')).toBeInTheDocument()
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
