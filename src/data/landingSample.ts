import type { FeedbackPoint, FeedbackSentiment, FormTrendAnalytics, WhatChanged } from './dashboardAnalytics'

/* Workplace: made-up HR pulse-survey results. */

const WORKPLACE_RESPONSE_COUNT = 214

/** Raw answers, each with the topic the AI filed it under (ids from its sample's topics). */
const WORKPLACE_COMMENTS = [
  { text: 'Swapping a shift still means three emails and a phone call.', topicId: 'shift' },
  { text: 'My manager actually listens when I raise something.', topicId: 'managers' },
  { text: 'Getting a swap approved takes days if my supervisor is away.', topicId: 'shift' },
  { text: 'Overtime on my payslip never matches what I worked.', topicId: 'pay' },
  { text: 'First week was great, but nobody showed me the HR system.', topicId: 'onboarding' },
  { text: 'Payroll answers my emails, but the numbers are still wrong.', topicId: 'pay' },
  { text: 'Swaps are fine if your manager is in, slow if they are on leave.', topicId: 'shift' },
  { text: 'The buddy system made my first month much easier.', topicId: 'onboarding' },
  { text: 'Nobody has ever explained how overtime is rounded.', topicId: 'pay' },
  { text: 'My supervisor checks in every week. It helps more than I expected.', topicId: 'managers' },
  { text: 'Our team lead jokes about which of us are "too old" to learn the new system.', topicId: 'remarks' },
  { text: 'I gave up asking for swaps and just work sick now.', topicId: 'shift' },
  { text: 'Training was rushed; I learned the system from a colleague.', topicId: 'onboarding' },
  { text: 'Night shift overtime is paid a month late.', topicId: 'pay' },
  { text: 'When I raised the rota problem, my manager fixed it the same day.', topicId: 'managers' },
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

const WORKPLACE_TOPICS: LandingTopic[] = [
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

const WORKPLACE_WHAT_CHANGED: WhatChanged = {
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

/** An open-house visitor's answer: "Visitor" (prospective student / parent) instead of department. */
const visitorPoint = (
  id: string,
  sentiment: FeedbackSentiment,
  quote: string,
  originalFeedback: string,
  visitor: string,
  extra: Partial<FeedbackPoint> = {},
): FeedbackPoint => ({
  ...point(id, sentiment, quote, originalFeedback, visitor, extra),
  submittedAt: '2026-10-17T10:15:00.000Z',
  demographics: [{ label: 'Visitor', value: visitor }],
})

const WORKPLACE_DRILL = {
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

const WORKPLACE_FLAGGED_POINT = point(
  'remarks-1',
  'negative',
  'Our team lead jokes about which of us are "too old" to learn the new system.',
  'Our team lead jokes about which of us are "too old" to learn the new system. It happens in front of everyone.',
  'Finance',
  { violation: true, violationStatus: 'possible', violationType: 'ethics' },
)

type TrendTopic = { id: string; label: string; negative: number[]; neutral: number[]; positive: number[] }

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)

/** The Trend tab's series from per-bucket sentiment counts, so totals always agree with the topics. */
function buildTrend(
  buckets: string[],
  topics: TrendTopic[],
  responseCounts: number[],
  timelineEvents: FormTrendAnalytics['timelineEvents'],
): LandingSample['trend'] {
  const bucketCounts = (t: TrendTopic, w: number) => ({
    negative: t.negative[w]!,
    neutral: t.neutral[w]!,
    positive: t.positive[w]!,
  })
  return {
    topicVolumeSeries: topics.map(({ id, label }) => ({ id, label })),
    volumeSeries: buckets.map((label, w) => ({
      label,
      ...Object.fromEntries(topics.map((t) => [t.id, t.negative[w]! + t.neutral[w]! + t.positive[w]!])),
    })),
    topicSentimentSeries: Object.fromEntries(topics.map((t) => [t.id, buckets.map((_, w) => bucketCounts(t, w))])),
    topicSummaries: topics.map((t) => {
      const counts = { negative: sum(t.negative), neutral: sum(t.neutral), positive: sum(t.positive) }
      return { id: t.id, mentions: counts.negative + counts.neutral + counts.positive, ...counts }
    }),
    sentimentSeries: buckets.map((label, w) => {
      const counts = { negative: 0, neutral: 0, positive: 0 }
      for (const t of topics) {
        counts.negative += t.negative[w]!
        counts.neutral += t.neutral[w]!
        counts.positive += t.positive[w]!
      }
      const total = counts.negative + counts.neutral + counts.positive
      const negative = Math.round((counts.negative / total) * 100)
      const positive = Math.round((counts.positive / total) * 100)
      return { label, negative, neutral: 100 - negative - positive, positive, counts }
    }),
    responseCounts,
    timelineEvents,
  }
}

// Per week: negative / neutral / positive mentions. Totals match WORKPLACE_TOPICS.
const WORKPLACE_TREND = buildTrend(
  ['1 Sep', '8 Sep', '15 Sep', '22 Sep', '29 Sep', '6 Oct', '13 Oct', '20 Oct'],
  [
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
  ],
  // Steady turnout while shift-swap mentions climb: the rise isn't just more people answering.
  [27, 26, 28, 26, 27, 27, 26, 27],
  [{ id: 'shift-spike', date: '2026-10-13T00:00:00.000Z', topicId: 'shift', bucketIndex: 6, count: 8, usual: 4 }],
)

/* Open house: made-up visitor feedback from weekly Saturday open-house days. */

const EVENT_COMMENTS = [
  { text: 'The registration line went past the main gate by nine.', topicId: 'registration' },
  { text: 'The robotics lab demo was the best part of the day.', topicId: 'labs' },
  { text: 'Took 40 minutes to find parking near the main building.', topicId: 'parking' },
  { text: 'Waited half an hour just to collect a name badge.', topicId: 'registration' },
  { text: 'No one could tell me the entry requirements for data science.', topicId: 'programmes' },
  { text: 'My son wants to apply after seeing the drone lab.', topicId: 'labs' },
  { text: 'The shuttle from the BTS ran every forty minutes.', topicId: 'parking' },
  { text: 'One desk for check-in and three hundred visitors.', topicId: 'registration' },
  { text: 'Student guides knew every lab, but not the fees.', topicId: 'programmes' },
  { text: 'A staff member at the info desk said engineering "isn\'t really for girls."', topicId: 'remarks' },
  { text: 'We parked at the temple next door and walked in the heat.', topicId: 'parking' },
  { text: 'The chemistry demo was loud, messy and brilliant.', topicId: 'labs' },
  { text: 'Online pre-registration would have saved us an hour.', topicId: 'registration' },
  { text: 'The programme booklet only covered half the faculties.', topicId: 'programmes' },
  { text: 'Let us try the equipment, not just watch.', topicId: 'labs' },
]

const EVENT_TOPICS: LandingTopic[] = [
  { id: 'registration', label: 'Registration queue is slow', negative: 28, neutral: 7, positive: 2, percentOfTotal: 22 },
  { id: 'labs', label: 'Hands-on lab demos', negative: 3, neutral: 8, positive: 25, percentOfTotal: 22 },
  { id: 'parking', label: 'Parking and getting to campus', negative: 22, neutral: 9, positive: 3, percentOfTotal: 21 },
  { id: 'programmes', label: 'Information on programmes', negative: 10, neutral: 12, positive: 8, percentOfTotal: 18 },
  {
    id: 'remarks',
    label: 'Remarks from a staff member',
    negative: 6,
    neutral: 1,
    positive: 0,
    percentOfTotal: 4,
    hasViolation: true,
  },
]

const EVENT_WHAT_CHANGED: WhatChanged = {
  currentLabel: 'October',
  previousLabel: 'September',
  rows: [
    {
      id: 'registration',
      label: 'Registration queue is slow',
      kind: 'worse',
      share: { previous: 14, current: 19 },
      complaints: { previous: 67, current: 82 },
      complaintCounts: { previous: { negative: 10, total: 15 }, current: { negative: 18, total: 22 } },
      violations: 0,
      quote: 'The registration line went past the main gate by nine.',
    },
    {
      id: 'signage',
      label: 'Signs to the lab building',
      kind: 'new',
      share: { previous: 0, current: 5 },
      complaints: { previous: 0, current: 71 },
      complaintCounts: { previous: { negative: 0, total: 0 }, current: { negative: 5, total: 7 } },
      violations: 0,
      quote: 'Followed the signs and ended up at the library twice.',
    },
    {
      id: 'remarks',
      label: 'Remarks from a staff member',
      kind: null,
      share: { previous: 4, current: 4 },
      complaints: { previous: 80, current: 83 },
      complaintCounts: { previous: { negative: 4, total: 5 }, current: { negative: 5, total: 6 } },
      violations: 2,
      quote: null,
    },
    {
      id: 'programmes',
      label: 'Information on programmes',
      kind: 'better',
      share: { previous: 20, current: 17 },
      complaints: { previous: 44, current: 21 },
      complaintCounts: { previous: { negative: 7, total: 16 }, current: { negative: 3, total: 14 } },
      violations: 0,
      quote: 'The student ambassadors answered every question about the IT programme.',
    },
  ],
}

const EVENT_DRILL = {
  label: 'Registration queue is slow',
  summary:
    'Visitors say check-in took up to half an hour at peak times, and some missed the first campus tour because of it.',
  points: [
    visitorPoint(
      'reg-1',
      'negative',
      'The registration line went past the main gate by nine.',
      'The registration line went past the main gate by nine. There was one desk for everyone.',
      'Parent',
    ),
    visitorPoint(
      'reg-2',
      'negative',
      'We missed the first campus tour waiting to check in.',
      'We missed the first campus tour waiting to check in, so we only saw half the faculties.',
      'Prospective student',
    ),
    visitorPoint(
      'reg-3',
      'neutral',
      'Check-in was quick after ten, the queue is only at opening.',
      'Check-in was quick after ten, the queue is only at opening. Maybe open more desks early.',
      'Prospective student',
    ),
  ],
}

const EVENT_FLAGGED_POINT = visitorPoint(
  'staff-remark-1',
  'negative',
  'A staff member at the info desk said engineering "isn\'t really for girls."',
  'A staff member at the info desk said engineering "isn\'t really for girls." My daughter heard it and didn\'t want to visit the labs after that.',
  'Parent',
  { violation: true, violationStatus: 'possible', violationType: 'ethics' },
)

// Per open-house Saturday. Totals match EVENT_TOPICS (remarks aren't charted, as in the workplace sample).
const EVENT_TREND = buildTrend(
  ['5 Sep', '12 Sep', '19 Sep', '26 Sep', '3 Oct', '10 Oct', '17 Oct', '24 Oct'],
  [
    {
      id: 'registration',
      label: 'Registration queue is slow',
      negative: [2, 2, 3, 3, 4, 4, 5, 5],
      neutral: [1, 1, 1, 1, 1, 1, 0, 1],
      positive: [0, 0, 1, 0, 0, 0, 1, 0],
    },
    {
      id: 'labs',
      label: 'Hands-on lab demos',
      negative: [1, 0, 0, 1, 0, 0, 1, 0],
      neutral: [1, 1, 1, 1, 1, 1, 1, 1],
      positive: [3, 3, 3, 3, 3, 3, 3, 4],
    },
    {
      id: 'parking',
      label: 'Parking and getting to campus',
      negative: [3, 3, 3, 3, 2, 3, 2, 3],
      neutral: [1, 1, 1, 2, 1, 1, 1, 1],
      positive: [0, 1, 0, 0, 1, 0, 1, 0],
    },
    {
      id: 'programmes',
      label: 'Information on programmes',
      negative: [2, 2, 2, 1, 1, 1, 1, 0],
      neutral: [2, 1, 2, 1, 2, 1, 2, 1],
      positive: [0, 1, 1, 1, 1, 1, 1, 2],
    },
  ],
  // About the same number of visitors answer each Saturday (168 in all).
  [21, 20, 22, 21, 21, 20, 22, 21],
  [
    {
      id: 'registration-spike',
      date: '2026-10-17T00:00:00.000Z',
      topicId: 'registration',
      bucketIndex: 6,
      count: 6,
      usual: 4,
    },
  ],
)

export type LandingSampleId = 'workplace' | 'event'

export type LandingSample = {
  /** The sample form's name, as the dashboard heads it. */
  formTitle: string
  responseCount: number
  comments: { text: string; topicId: string }[]
  topics: LandingTopic[]
  whatChanged: WhatChanged
  drill: { label: string; summary: string; points: FeedbackPoint[] }
  flaggedTopic: string
  flaggedPoint: FeedbackPoint
  trend: Pick<
    FormTrendAnalytics,
    | 'topicVolumeSeries'
    | 'volumeSeries'
    | 'topicSentimentSeries'
    | 'topicSummaries'
    | 'sentimentSeries'
    | 'responseCounts'
    | 'timelineEvents'
  >
  /** Pinned on the trend chart to start with: the topic that's getting worse. */
  pinnedTopic: string
}

/** Made-up results for the signed-out landing page, shown under a "Sample data" label. */
export const LANDING_SAMPLES: Record<LandingSampleId, LandingSample> = {
  workplace: {
    formTitle: 'Staff pulse survey, October',
    responseCount: WORKPLACE_RESPONSE_COUNT,
    comments: WORKPLACE_COMMENTS,
    topics: WORKPLACE_TOPICS,
    whatChanged: WORKPLACE_WHAT_CHANGED,
    drill: WORKPLACE_DRILL,
    flaggedTopic: 'Remarks from a team lead',
    flaggedPoint: WORKPLACE_FLAGGED_POINT,
    trend: WORKPLACE_TREND,
    pinnedTopic: 'shift',
  },
  event: {
    formTitle: 'Open house visitor feedback, October',
    responseCount: 168,
    comments: EVENT_COMMENTS,
    topics: EVENT_TOPICS,
    whatChanged: EVENT_WHAT_CHANGED,
    drill: EVENT_DRILL,
    flaggedTopic: 'Remarks from a staff member',
    flaggedPoint: EVENT_FLAGGED_POINT,
    trend: EVENT_TREND,
    pinnedTopic: 'registration',
  },
}

export const LANDING_SAMPLE_OPTIONS: { id: LandingSampleId; label: string }[] = [
  { id: 'workplace', label: 'Workplace' },
  { id: 'event', label: 'Open house' },
]
