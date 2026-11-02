import type { FormIndividualResponses, FormResponseAnalytics, FormThemeAnalytics } from '../api/analytics'
import { sentimentScore } from '../components/dashboard/sentimentScore'
import type { FeedbackPoint, FeedbackSentiment, FormTrendAnalytics, SentimentCounts, TopicSentiment } from './dashboardAnalytics'
import { LANDING_SAMPLES } from './landingSample'

/**
 * A believable dashboard for a form with no responses yet, shown while a tour walks someone
 * through an empty dashboard (see FormDashboardPage), behind a "sample data" banner. Never
 * mixed with real data. Built from the landing page's Workplace sample.
 */

const WORKPLACE = LANDING_SAMPLES.workplace

const WEEKS = WORKPLACE.trend.volumeSeries.map((bucket) => String(bucket.label))
const DEPARTMENTS = ['Warehouse', 'Customer service', 'Finance', 'Operations']
const SHIFTS = ['Day', 'Night']
// Made-up respondents, so the sample shows names — and with them the Show names toggle.
const NAMES = [
  'Somchai J.', 'Malee P.', 'Anan K.', 'Pim S.', 'Krit T.', 'Nok W.', 'Ploy R.', 'Arthit C.',
  'Fah N.', 'Tawan B.', 'Kanya L.', 'Niran D.', 'Dao M.', 'Chai V.', 'Ying H.',
]

// Day 1 is 1 Sep 2026; later days roll over into October.
const iso = (day: number) => new Date(Date.UTC(2026, 8, day, 9, 30)).toISOString()

// Weekly counts for the topics the landing Trend chart doesn't carry. Totals match What changed.
const EXTRA_WEEKLY: Record<string, SentimentCounts[]> = {
  parking: [0, 0, 0, 0, 0, 2, 3, 4].map((negative, w) => ({ negative, neutral: w >= 5 ? 1 : 0, positive: w === 6 ? 1 : 0 })),
  remarks: [1, 1, 1, 0, 1, 1, 1, 1].map((negative, w) => ({ negative, neutral: w === 2 || w === 5 ? 1 : 0, positive: 0 })),
}

// What people wrote, per topic and sentiment; mentions take these in turn.
const QUOTES: Record<string, Partial<Record<FeedbackSentiment, string[]>>> = {
  shift: {
    negative: [
      'Swapping a shift still means three emails and a phone call.',
      'Getting a swap approved takes days if my supervisor is away.',
      'I gave up asking for swaps and just work sick now.',
      'I waited four days for a swap to be approved.',
    ],
    neutral: ['Swaps are fine if your manager is in, slow if they are on leave.'],
    positive: ['My team lead approved my swap within the hour this time.'],
  },
  pay: {
    negative: [
      'Overtime on my payslip never matches what I worked.',
      'Payroll answers my emails, but the numbers are still wrong.',
      'Night shift overtime is paid a month late.',
    ],
    neutral: ['Nobody has ever explained how overtime is rounded.'],
    positive: ['Payroll fixed my missing overtime the same week.'],
  },
  managers: {
    negative: ['My manager is hard to reach on night shifts.'],
    neutral: ['My manager is fine, but our one-to-ones keep getting cancelled.'],
    positive: [
      'My manager actually listens when I raise something.',
      'My supervisor checks in every week. It helps more than I expected.',
      'When I raised the rota problem, my manager fixed it the same day.',
    ],
  },
  onboarding: {
    negative: ['Training was rushed; I learned the system from a colleague.'],
    neutral: ['First week was great, but nobody showed me the HR system.'],
    positive: ['The buddy system made my first month much easier.'],
  },
  parking: {
    negative: [
      'There are 40 spaces for 120 people on the morning shift.',
      'I park on the street and walk 15 minutes in the dark.',
    ],
    neutral: ['Parking is fine after 10, but the morning shift has nowhere to go.'],
    positive: ['The new bike racks at the new site are a nice touch.'],
  },
  remarks: {
    // Seven negative mentions: the first three are the flagged ones (What changed counts 3).
    negative: [
      'Our team lead jokes about which of us are "too old" to learn the new system.',
      'Older staff get called "dinosaurs" in our team meetings.',
      'He says people over 50 should just retire instead of asking for training.',
      'Our team lead talks down to the older staff.',
      'Meetings with our team lead feel tense.',
      'Feedback from our team lead is personal, not about the work.',
      'I avoid asking our team lead questions now.',
    ],
    neutral: ['Our team lead can be blunt with older colleagues.'],
  },
}
const FLAGGED = new Set(QUOTES.remarks!.negative!.slice(0, 3))

const KEYWORDS: Record<string, string[]> = {
  shift: ['swap', 'approval', 'supervisor'],
  pay: ['overtime', 'payslip', 'payroll'],
  managers: ['manager', 'listens', 'support'],
  onboarding: ['training', 'buddy', 'HR system'],
  parking: ['parking', 'new site', 'morning shift'],
  remarks: ['team lead', 'age', 'remarks'],
}

const parking = WORKPLACE.whatChanged.rows.find((row) => row.id === 'parking')!
const seeds = [
  ...WORKPLACE.topics.map((topic) => ({ id: topic.id, label: topic.label, percent: topic.percentOfTotal })),
  { id: parking.id, label: parking.label, percent: parking.share.current },
]
const weeklyOf = (id: string) => WORKPLACE.trend.topicSentimentSeries[id] ?? EXTRA_WEEKLY[id]!
const total = (counts: SentimentCounts) => counts.negative + counts.neutral + counts.positive
const SENTIMENTS: FeedbackSentiment[] = ['negative', 'neutral', 'positive']

/* Responses first: every mention on Themes and Trend is part of one of them, as on a real form. */

const N = WORKPLACE.responseCount
const USED = ['Shift swap form', 'Payroll helpdesk', 'Buddy scheme', 'Staff car park']
const DEPARTMENT_COUNTS = [72, 64, 38, 40]
const SHIFT_COUNTS = [138, 76]
const USED_COUNTS = [121, 84, 29, 97]

// Response i's slot in a fixed shuffle of 0..N-1 (step is coprime with N, so every slot is used once).
const slot = (i: number, step: number, offset: number) => (i * step + offset) % N
// The option whose share of N the slot falls in, so each option is picked exactly its count's times.
const optionAt = (position: number, counts: number[]) => {
  let end = 0
  return counts.findIndex((count) => position < (end += count))
}
const INITIALS = 'JPKSTWRCNBLDMVH'
// A different name for every response: 15 first names, each with up to 15 initials.
const respondentAt = (i: number) => `${NAMES[i % NAMES.length]!.split(' ')[0]} ${INITIALS[(i + Math.floor(i / 15)) % 15]}.`
// Newest first, each week holding as many responses as the Trend tab's response counts.
const responseDays = (WORKPLACE.trend.responseCounts ?? [])
  .flatMap((count, w) => Array.from({ length: count }, (_, k) => 1 + w * 7 + (k % 7)))
  .sort((a, b) => b - a)

type Mention = { topicId: string; sentiment: FeedbackSentiment; quote: string }

const respondents = Array.from({ length: N }, (_, i) => ({
  id: -(i + 1),
  name: respondentAt(i),
  week: Math.floor((responseDays[i]! - 1) / 7),
  // Newest first, also within a day.
  submittedAt: new Date(Date.UTC(2026, 8, responseDays[i]!, 18 - (i % 10), (i * 7) % 60)).toISOString(),
  department: DEPARTMENTS[optionAt(slot(i, 37, 11), DEPARTMENT_COUNTS)]!,
  shift: SHIFTS[optionAt(slot(i, 53, 5), SHIFT_COUNTS)]!,
  used: USED.filter((_, k) => slot(i, [3, 5, 7, 9][k]!, k * 17) < USED_COUNTS[k]!),
  mentions: [] as Mention[],
}))

// Hand each week's mentions to that week's responses in turn. A busy week wraps round, so a
// few answers mention two topics; the rest left the comment box empty.
{
  const turn: Record<number, number> = {}
  for (const seed of seeds) {
    const used: Partial<Record<FeedbackSentiment, number>> = {}
    weeklyOf(seed.id).forEach((week, w) => {
      const inWeek = respondents.filter((r) => r.week === w)
      for (const sentiment of SENTIMENTS) {
        for (let n = 0; n < week[sentiment]; n++) {
          const pool = QUOTES[seed.id]![sentiment]!
          const k = (used[sentiment] = (used[sentiment] ?? -1) + 1)
          const at = (turn[w] = (turn[w] ?? -1) + 1)
          inWeek[at % inWeek.length]!.mentions.push({ topicId: seed.id, sentiment, quote: pool[k % pool.length]! })
        }
      }
    })
  }
}
const textOf = (r: (typeof respondents)[number]) => r.mentions.map((m) => m.quote).join(' ')

const topics: TopicSentiment[] = seeds.map((seed) => {
  const weekly = weeklyOf(seed.id)
  const counts = weekly.reduce(
    (sum, week) => ({
      negative: sum.negative + week.negative,
      neutral: sum.neutral + week.neutral,
      positive: sum.positive + week.positive,
    }),
    { negative: 0, neutral: 0, positive: 0 },
  )
  const feedbackSegment: FeedbackPoint[] = respondents.flatMap((r) =>
    r.mentions
      .filter((m) => m.topicId === seed.id)
      .map((m) => ({
        id: `${seed.id}${r.id}`,
        submissionId: r.id,
        sentiment: m.sentiment,
        violation: FLAGGED.has(m.quote),
        ...(FLAGGED.has(m.quote) ? { violationStatus: 'possible' as const, violationType: 'ethics' } : {}),
        quote: m.quote,
        originalFeedback: textOf(r),
        submittedAt: r.submittedAt,
        respondentName: r.name,
        volumeBucket: r.week,
        demographics: [
          { label: 'Department', value: r.department },
          { label: 'Shift pattern', value: r.shift },
        ],
      })),
  )
  return {
    id: seed.id,
    label: seed.label,
    ...counts,
    percentOfTotal: seed.percent,
    hasViolation: feedbackSegment.some((point) => point.violation),
    aiSummary: WORKPLACE.topicSummaries[seed.id],
    keywords: KEYWORDS[seed.id]!.map((text, k) => ({ text, weight: (k === 0 ? 3 : k === 1 ? 2 : 1) as 1 | 2 | 3 })),
    feedbackSegment,
    volumeSeries: WEEKS.map((label, w) => ({ label, value: total(weekly[w]!), ...weekly[w]! })),
  }
})

const totalMentions = topics.reduce((sum, t) => sum + total(t), 0)
const counts = {
  negative: topics.reduce((sum, t) => sum + t.negative, 0),
  neutral: topics.reduce((sum, t) => sum + t.neutral, 0),
  positive: topics.reduce((sum, t) => sum + t.positive, 0),
}
const LAST_DAY = 1 + (WEEKS.length - 1) * 7 + 6
const RANGE_LABEL = 'Sep 1, 2026 – Oct 26, 2026'

export const SAMPLE_THEMES: FormThemeAnalytics = {
  from: iso(1),
  to: iso(LAST_DAY),
  rangeLabel: RANGE_LABEL,
  lastAnalysedAt: respondents[0]!.submittedAt,
  totalMentions,
  totalResponders: N,
  awaitingAnalysis: 0,
  responderDelta: 6,
  responderDeltaLabel: '+6 today',
  demographicFilters: [
    { label: 'Department', options: DEPARTMENTS },
    { label: 'Shift pattern', options: SHIFTS },
  ],
  sentiment: { score: sentimentScore(counts), outOf: 5, ...counts },
  violationTopics: topics.filter((t) => t.hasViolation),
  aiDiscoveredTopics: topics,
}

// Every topic gets a line: there are only six, and the demo hides the topic picker.
const weeklyAll = WEEKS.map((_, w) =>
  seeds.reduce(
    (sum, seed) => {
      const week = weeklyOf(seed.id)[w]!
      return { negative: sum.negative + week.negative, neutral: sum.neutral + week.neutral, positive: sum.positive + week.positive }
    },
    { negative: 0, neutral: 0, positive: 0 },
  ),
)

export const SAMPLE_TREND: FormTrendAnalytics = {
  ...WORKPLACE.trend,
  topicVolumeSeries: seeds.map(({ id, label }) => ({ id, label })),
  volumeSeries: WEEKS.map((label, w) => ({
    label,
    ...Object.fromEntries(seeds.map((seed) => [seed.id, total(weeklyOf(seed.id)[w]!)])),
  })),
  topicSentimentSeries: Object.fromEntries(seeds.map((seed) => [seed.id, weeklyOf(seed.id)])),
  topicSummaries: topics.map((t) => ({ id: t.id, mentions: total(t), negative: t.negative, neutral: t.neutral, positive: t.positive })),
  sentimentSeries: WEEKS.map((label, w) => {
    const counts = weeklyAll[w]!
    const negative = Math.round((counts.negative / total(counts)) * 100)
    const positive = Math.round((counts.positive / total(counts)) * 100)
    return { label, negative, neutral: 100 - negative - positive, positive, counts }
  }),
  bucket: 'week',
  rank: 'mentioned',
  from: iso(1),
  to: iso(LAST_DAY),
  rangeLabel: RANGE_LABEL,
  totalMentions,
  availableTopics: topics.map((t) => ({
    id: t.id,
    label: t.label,
    mentions: total(t),
    violations: t.feedbackSegment.filter((p) => p.violation).length,
  })),
  whatChanged: WORKPLACE.whatChanged,
}

export const SAMPLE_RESPONSES: FormResponseAnalytics = {
  totalResponses: N,
  lastResponseAt: respondents[0]!.submittedAt,
  demographic: [
    {
      kind: 'single-choice',
      id: 'sample-department',
      title: 'Department',
      options: DEPARTMENTS.map((label, i) => ({ id: label, label, value: DEPARTMENT_COUNTS[i]! })),
    },
    {
      kind: 'single-choice',
      id: 'sample-shift',
      title: 'Shift pattern',
      options: SHIFTS.map((label, i) => ({ id: label, label, value: SHIFT_COUNTS[i]! })),
    },
  ],
  feedback: [
    {
      kind: 'multi-choice',
      id: 'sample-used',
      title: 'Which of these did you use this month?',
      totalRespondents: N,
      options: USED.map((label, i) => ({ id: label, label, value: USED_COUNTS[i]! })),
    },
    {
      kind: 'text',
      id: 'sample-feedback-text',
      title: "Anything else you'd like to tell us?",
      responses: respondents.filter((r) => r.mentions.length).map((r) => ({ text: textOf(r), respondentName: r.name })),
    },
  ],
}

export const SAMPLE_INDIVIDUAL: FormIndividualResponses = {
  fields: [
    { id: 1, title: 'Department', section: 'demographic', type: 'radio' },
    { id: 2, title: 'Shift pattern', section: 'demographic', type: 'radio' },
    { id: 3, title: 'Which of these did you use this month?', section: 'feedback', type: 'checkbox' },
    { id: 4, title: "Anything else you'd like to tell us?", section: 'feedback', type: 'textarea' },
  ],
  responses: respondents.map((r, i) => ({
    id: r.id,
    number: N - i,
    submittedAt: r.submittedAt,
    respondentName: r.name,
    answers: { 1: [r.department], 2: [r.shift], 3: r.used, 4: r.mentions.length ? [textOf(r)] : [] },
    // What the AI filed this answer under, for the panel's AI analysis.
    points: r.mentions.map((m) => ({
      topicId: m.topicId,
      topic: seeds.find((seed) => seed.id === m.topicId)!.label,
      sentiment: m.sentiment,
      violation: FLAGGED.has(m.quote),
      text: m.quote,
    })),
  })),
}
