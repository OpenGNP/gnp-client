import type { FeedbackPoint, FeedbackSentiment, FormTrendAnalytics, WhatChanged } from './dashboardAnalytics'

/** Made-up HR pulse-survey results for the signed-out landing page. Shown under a "Sample data" label. */

export const SAMPLE_RESPONSE_COUNT = 214

/** Raw answers, each with the topic the AI filed it under (ids from LANDING_TOPICS). */
export const RAW_COMMENTS = [
  { text: 'Swapping a shift still means three emails and a phone call.', topicId: 'shift' },
  { text: 'My manager actually listens when I raise something.', topicId: 'managers' },
  { text: 'Getting a swap approved takes days if my supervisor is away.', topicId: 'shift' },
  { text: 'Overtime on my payslip never matches what I worked.', topicId: 'pay' },
  { text: 'First week was great, but nobody showed me the HR system.', topicId: 'onboarding' },
]

export type LandingTopic = {
  id: string
  label: string
  negative: number
  neutral: number
  positive: number
  percentOfTotal: number
  hasViolation?: boolean
}

export const LANDING_TOPICS: LandingTopic[] = [
  { id: 'shift', label: 'Shift swaps take too long', negative: 31, neutral: 8, positive: 3, percentOfTotal: 22 },
  { id: 'pay', label: 'Overtime pay is unclear', negative: 24, neutral: 10, positive: 4, percentOfTotal: 19 },
  { id: 'managers', label: 'Supportive line managers', negative: 4, neutral: 9, positive: 27, percentOfTotal: 18 },
  { id: 'onboarding', label: 'Onboarding for new hires', negative: 9, neutral: 12, positive: 11, percentOfTotal: 15 },
  {
    id: 'remarks',
    label: 'Remarks from a team lead',
    negative: 7,
    neutral: 2,
    positive: 0,
    percentOfTotal: 4,
    hasViolation: true,
  },
]

export const LANDING_WHAT_CHANGED: WhatChanged = {
  currentLabel: 'October',
  previousLabel: 'September',
  rows: [
    {
      id: 'shift',
      label: 'Shift swaps take too long',
      kind: 'worse',
      share: { previous: 14, current: 22 },
      complaints: { previous: 52, current: 74 },
      complaintCounts: { previous: { negative: 13, total: 25 }, current: { negative: 31, total: 42 } },
      violations: 0,
      quote: 'Swapping a shift still means three emails and a phone call.',
    },
    {
      id: 'parking',
      label: 'Parking at the new site',
      kind: 'new',
      share: { previous: 0, current: 6 },
      complaints: { previous: 0, current: 69 },
      complaintCounts: { previous: { negative: 0, total: 0 }, current: { negative: 9, total: 13 } },
      violations: 0,
      quote: 'There are 40 spaces for 120 people on the morning shift.',
    },
    {
      id: 'remarks',
      label: 'Remarks from a team lead',
      kind: null,
      share: { previous: 4, current: 4 },
      complaints: { previous: 70, current: 78 },
      complaintCounts: { previous: { negative: 7, total: 10 }, current: { negative: 7, total: 9 } },
      violations: 3,
      quote: null,
    },
    {
      id: 'onboarding',
      label: 'Onboarding for new hires',
      kind: 'better',
      share: { previous: 17, current: 15 },
      complaints: { previous: 55, current: 28 },
      complaintCounts: { previous: { negative: 18, total: 33 }, current: { negative: 9, total: 32 } },
      violations: 0,
      quote: 'The buddy system made my first month much easier.',
    },
  ],
}

const point = (
  id: string,
  sentiment: FeedbackSentiment,
  quote: string,
  originalFeedback: string,
  department: string,
  extra: Partial<FeedbackPoint> = {},
): FeedbackPoint => ({
  id,
  sentiment,
  quote,
  originalFeedback,
  submittedAt: '2026-10-14T09:30:00.000Z',
  demographics: [{ label: 'Department', value: department }],
  ...extra,
})

export const DRILL_TOPIC = {
  label: 'Shift swaps take too long',
  summary:
    'Staff say swapping a shift needs several approvals by email and can take days, so many give up or work while unwell.',
  points: [
    point(
      'swap-1',
      'negative',
      'Swapping a shift still means three emails and a phone call.',
      'Swapping a shift still means three emails and a phone call. Most of us just stopped asking.',
      'Warehouse',
    ),
    point(
      'swap-2',
      'negative',
      'I waited four days for a swap to be approved.',
      'I waited four days for a swap to be approved and ended up working the shift anyway.',
      'Customer service',
    ),
    point(
      'swap-3',
      'neutral',
      'Swaps are fine if your manager is in, slow if they are on leave.',
      'Swaps are fine if your manager is in, slow if they are on leave. There is no backup approver.',
      'Warehouse',
    ),
  ],
}

export const FLAGGED_TOPIC = 'Remarks from a team lead'

export const FLAGGED_POINT = point(
  'remarks-1',
  'negative',
  'Our team lead jokes about which of us are "too old" to learn the new system.',
  'Our team lead jokes about which of us are "too old" to learn the new system. It happens in front of everyone.',
  'Finance',
  { violation: true, violationStatus: 'possible', violationType: 'ethics' },
)

const TREND_WEEKS = ['1 Sep', '8 Sep', '15 Sep', '22 Sep', '29 Sep', '6 Oct', '13 Oct', '20 Oct']

// Per week: negative / neutral / positive mentions. Totals match LANDING_TOPICS.
const TREND_TOPICS = [
  {
    id: 'shift',
    label: 'Shift swaps take too long',
    negative: [2, 2, 3, 3, 4, 5, 6, 6],
    neutral: [1, 1, 1, 1, 1, 1, 1, 1],
    positive: [0, 0, 0, 1, 0, 0, 1, 1],
  },
  {
    id: 'pay',
    label: 'Overtime pay is unclear',
    negative: [3, 3, 3, 3, 3, 3, 3, 3],
    neutral: [1, 2, 0, 2, 1, 1, 1, 2],
    positive: [1, 0, 1, 0, 1, 0, 1, 0],
  },
  {
    id: 'managers',
    label: 'Supportive line managers',
    negative: [1, 0, 1, 0, 1, 0, 1, 0],
    neutral: [0, 2, 1, 2, 1, 1, 1, 1],
    positive: [3, 3, 3, 3, 3, 4, 4, 4],
  },
  {
    id: 'onboarding',
    label: 'Onboarding for new hires',
    negative: [2, 2, 1, 1, 1, 1, 1, 0],
    neutral: [3, 2, 2, 2, 1, 0, 1, 1],
    positive: [1, 1, 2, 1, 1, 2, 1, 2],
  },
]

const weekCounts = (t: (typeof TREND_TOPICS)[number], w: number) => ({
  negative: t.negative[w]!,
  neutral: t.neutral[w]!,
  positive: t.positive[w]!,
})
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)

export const LANDING_TREND: Pick<
  FormTrendAnalytics,
  | 'topicVolumeSeries'
  | 'volumeSeries'
  | 'topicSentimentSeries'
  | 'topicSummaries'
  | 'sentimentSeries'
  | 'responseCounts'
  | 'timelineEvents'
> = {
  topicVolumeSeries: TREND_TOPICS.map(({ id, label }) => ({ id, label })),
  volumeSeries: TREND_WEEKS.map((label, w) => ({
    label,
    ...Object.fromEntries(TREND_TOPICS.map((t) => [t.id, t.negative[w]! + t.neutral[w]! + t.positive[w]!])),
  })),
  topicSentimentSeries: Object.fromEntries(TREND_TOPICS.map((t) => [t.id, TREND_WEEKS.map((_, w) => weekCounts(t, w))])),
  topicSummaries: TREND_TOPICS.map((t) => {
    const counts = { negative: sum(t.negative), neutral: sum(t.neutral), positive: sum(t.positive) }
    return { id: t.id, mentions: counts.negative + counts.neutral + counts.positive, ...counts }
  }),
  sentimentSeries: TREND_WEEKS.map((label, w) => {
    const counts = { negative: 0, neutral: 0, positive: 0 }
    for (const t of TREND_TOPICS) {
      counts.negative += t.negative[w]!
      counts.neutral += t.neutral[w]!
      counts.positive += t.positive[w]!
    }
    const total = counts.negative + counts.neutral + counts.positive
    const negative = Math.round((counts.negative / total) * 100)
    const positive = Math.round((counts.positive / total) * 100)
    return { label, negative, neutral: 100 - negative - positive, positive, counts }
  }),
  // Steady turnout while shift-swap mentions climb: the rise isn't just more people answering.
  responseCounts: [27, 26, 28, 26, 27, 27, 26, 27],
  timelineEvents: [{ id: 'shift-spike', date: '2026-10-13T00:00:00.000Z', topicId: 'shift', bucketIndex: 6, count: 8, usual: 4 }],
}
