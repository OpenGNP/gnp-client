import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TrendView } from '../src/components/dashboard/TrendView'
import type { FormTrendAnalytics } from '../src/data/dashboardAnalytics'

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const trend: FormTrendAnalytics = {
  bucket: 'week',
  rank: 'mentioned',
  from: '',
  to: '',
  rangeLabel: '',
  comparisonLabel: 'last 7 days vs the week before',
  totalMentions: 20,
  topicVolumeSeries: [],
  availableTopics: [],
  volumeSeries: [],
  topicSentimentSeries: {},
  topicSummaries: [],
  sentimentSeries: [],
  risingTopics: [
    {
      id: '1',
      label: 'Canteen',
      currentMentions: 12,
      previousMentions: 6,
      delta: 6,
      status: 'existing',
      positiveDelta: -1,
      negativeDelta: 6,
      currentPositive: 2,
      previousPositive: 3,
      currentNegative: 8,
      previousNegative: 2,
    },
  ],
  decliningTopics: [],
  movementRule: { minDelta: 2, limit: 5 },
  emergingIssues: [],
  timelineEvents: [],
}

describe('Rising / Declining tooltips', () => {
  it("hovering a row's numbers shows now vs before for mentions and sentiment", async () => {
    const user = userEvent.setup()
    render(<TrendView trend={trend} />)
    await user.hover(screen.getByLabelText('Canteen: 12 mentions now, 6 before'))
    const tip = await screen.findByRole('tooltip')
    expect(tip).toHaveTextContent('last 7 days vs the week before')
    expect(tip).toHaveTextContent('Mentions126+6')
    expect(tip).toHaveTextContent('Positive23−1')
    expect(tip).toHaveTextContent('Negative82+6')
  })

  it('the ⓘ next to the title explains the rule from the API', async () => {
    const user = userEvent.setup()
    render(<TrendView trend={trend} />)
    await user.hover(screen.getByRole('button', { name: 'How Rising Topics is worked out' }))
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Topics whose mentions went up by at least 2 (last 7 days vs the week before). The top 5 are shown.',
    )
  })
})
