import type { FormIndividualResponses, FormResponseAnalytics, FormThemeAnalytics } from '../api/analytics'
import type { FeedbackPoint, FeedbackSentiment, FormTrendAnalytics, TopicSentiment } from './dashboardAnalytics'

/**
 * A believable dashboard for a form with no responses yet — shown only while a tour
 * walks someone through an empty dashboard (see FormDashboardPage), behind a "sample
 * data" banner, with Export and Share disabled. Never mixed with real data.
 */

const WEEKS = ['1 Sep', '8 Sep', '15 Sep', '22 Sep', '29 Sep', '6 Oct']
const YEARS = ['Year 1', 'Year 2', 'Year 3', 'Year 4']
const PROGRAMS = ['Computer Science', 'Information Technology', 'Data Science']
// Made-up respondents, so the sample shows names — and with them the Show names toggle.
const NAMES = ['Somchai J.', 'Malee P.', 'Anan K.', 'Pim S.', 'Krit T.', 'Nok W.']
const nameAt = (i: number) => NAMES[i % NAMES.length]!

const iso = (day: number) => new Date(Date.UTC(2026, 8, day, 9, 30)).toISOString()

type TopicSeed = {
  id: string
  label: string
  summary: string
  keywords: string[]
  weekly: number[]
  quotes: [FeedbackSentiment, string, boolean?][]
}

const TOPICS: TopicSeed[] = [
  {
    id: 'sample-wifi',
    label: 'Unreliable Wi-Fi in classrooms',
    summary: 'Students say the Wi-Fi drops during lectures and online quizzes, especially in large rooms.',
    keywords: ['wifi', 'connection', 'quiz', 'classroom'],
    weekly: [3, 4, 6, 9, 12, 14],
    quotes: [
      ['negative', 'The Wi-Fi cut out twice during the online quiz.'],
      ['negative', 'Hard to follow slides when the connection keeps dropping.'],
      ['neutral', 'Wi-Fi is fine in the library but not in room 401.'],
    ],
  },
  {
    id: 'sample-feedback',
    label: 'Clear and helpful lecturers',
    summary: 'Many students appreciate lecturers who explain clearly and answer questions after class.',
    keywords: ['lecturer', 'explain', 'helpful', 'questions'],
    weekly: [8, 9, 7, 9, 10, 9],
    quotes: [
      ['positive', 'The lecturer explains difficult topics really clearly.'],
      ['positive', 'Always happy to answer questions after class.'],
      ['neutral', 'Good explanations, but the pace is a bit fast.'],
    ],
  },
  {
    id: 'sample-workload',
    label: 'Heavy assignment workload',
    summary: 'Several assignments are due in the same week, which students find stressful.',
    keywords: ['assignment', 'deadline', 'workload', 'stress'],
    weekly: [2, 3, 5, 7, 6, 8],
    quotes: [
      ['negative', 'Three assignments were due on the same Friday.'],
      ['negative', 'The workload this term is too much to keep up with.'],
      ['neutral', 'Deadlines would be easier if they were spread out.'],
    ],
  },
  {
    id: 'sample-canteen',
    label: 'Canteen food and prices',
    summary: 'Mixed views on the canteen: good variety, but prices went up and queues are long.',
    keywords: ['canteen', 'price', 'queue', 'food'],
    weekly: [5, 4, 5, 3, 4, 3],
    quotes: [
      ['neutral', 'More choices this term, but prices are higher.'],
      ['negative', 'The lunch queue takes 20 minutes.'],
      ['positive', 'The new noodle stall is great.'],
    ],
  },
  {
    id: 'sample-grading',
    label: 'Unfair grading reports',
    summary: 'A few students report grades being changed after complaints, which the AI flagged for review.',
    keywords: ['grade', 'unfair', 'complaint'],
    weekly: [0, 0, 1, 1, 2, 3],
    quotes: [
      ['negative', 'My grade was lowered after I complained about the exam.', true],
      ['negative', 'Some students got extra marks for helping the lecturer privately.', true],
    ],
  },
]

const sentimentOf = (quotes: TopicSeed['quotes'], key: FeedbackSentiment, total: number) => {
  const share = quotes.filter(([sentiment]) => sentiment === key).length / quotes.length
  return Math.round(total * share)
}

const topics: TopicSentiment[] = (() => {
  const totals = TOPICS.map((seed) => seed.weekly.reduce((sum, n) => sum + n, 0))
  const all = totals.reduce((sum, n) => sum + n, 0)
  return TOPICS.map((seed, index) => {
    const total = totals[index]!
    const negative = sentimentOf(seed.quotes, 'negative', total)
    const positive = sentimentOf(seed.quotes, 'positive', total)
    const feedbackSegment: FeedbackPoint[] = seed.quotes.map(([sentiment, text, violation], q) => ({
      id: `${seed.id}-${q}`,
      sentiment,
      violation: Boolean(violation),
      quote: text,
      originalFeedback: text,
      submittedAt: iso(30 - q * 3),
      respondentName: nameAt(index + q),
      volumeBucket: WEEKS.length - 1 - q,
      demographics: [
        { label: 'Year of study', value: YEARS[(index + q) % YEARS.length]! },
        { label: 'Program of study', value: PROGRAMS[(index + q) % PROGRAMS.length]! },
      ],
    }))
    return {
      id: seed.id,
      label: seed.label,
      negative,
      positive,
      neutral: total - negative - positive,
      percentOfTotal: Math.round((total / all) * 100),
      hasViolation: seed.quotes.some(([, , violation]) => violation),
      aiSummary: seed.summary,
      keywords: seed.keywords.map((text, k) => ({ text, weight: (k === 0 ? 3 : k === 1 ? 2 : 1) as 1 | 2 | 3 })),
      feedbackSegment,
      volumeSeries: WEEKS.map((label, w) => ({ label, value: seed.weekly[w]! })),
    }
  })
})()

const totalMentions = topics.reduce((sum, t) => sum + t.negative + t.neutral + t.positive, 0)
const sum = (key: FeedbackSentiment) => topics.reduce((total, t) => total + t[key], 0)

export const SAMPLE_THEMES: FormThemeAnalytics = {
  from: iso(1),
  to: iso(30),
  rangeLabel: 'Sep 1, 2026 – Oct 6, 2026',
  lastAnalysedAt: iso(30),
  totalMentions,
  totalResponders: 124,
  awaitingAnalysis: 0,
  responderDelta: 6,
  responderDeltaLabel: '+6 today',
  demographicFilters: [
    { label: 'Year of study', options: YEARS },
    { label: 'Program of study', options: PROGRAMS },
  ],
  sentiment: {
    score: 2.6,
    outOf: 5,
    negative: sum('negative'),
    neutral: sum('neutral'),
    positive: sum('positive'),
  },
  violationTopics: topics.filter((t) => t.hasViolation),
  aiDiscoveredTopics: topics,
}

const charted = TOPICS.slice(0, 4)

export const SAMPLE_TREND: FormTrendAnalytics = {
  bucket: 'week',
  rank: 'mentioned',
  from: iso(1),
  to: iso(30),
  rangeLabel: SAMPLE_THEMES.rangeLabel,
  totalMentions,
  topicVolumeSeries: charted.map((seed) => ({ id: seed.id, label: seed.label })),
  availableTopics: topics.map((t) => ({
    id: t.id,
    label: t.label,
    mentions: t.negative + t.neutral + t.positive,
    violations: t.feedbackSegment.filter((p) => p.violation).length,
  })),
  volumeSeries: WEEKS.map((label, w) => ({
    label,
    ...Object.fromEntries(charted.map((seed) => [seed.id, seed.weekly[w]!])),
  })),
  topicSentimentSeries: Object.fromEntries(
    charted.map((seed) => [
      seed.id,
      seed.weekly.map((n) => {
        const negative = sentimentOf(seed.quotes, 'negative', n)
        const positive = sentimentOf(seed.quotes, 'positive', n)
        return { negative, positive, neutral: n - negative - positive }
      }),
    ]),
  ),
  topicSummaries: topics
    .filter((t) => charted.some((seed) => seed.id === t.id))
    .map((t) => ({ id: t.id, mentions: t.negative + t.neutral + t.positive, negative: t.negative, neutral: t.neutral, positive: t.positive })),
  sentimentSeries: WEEKS.map((label, w) => {
    const counts = { negative: 0, neutral: 0, positive: 0 }
    for (const seed of TOPICS) {
      const n = seed.weekly[w]!
      const negative = sentimentOf(seed.quotes, 'negative', n)
      const positive = sentimentOf(seed.quotes, 'positive', n)
      counts.negative += negative
      counts.positive += positive
      counts.neutral += n - negative - positive
    }
    const total = counts.negative + counts.neutral + counts.positive || 1
    return {
      label,
      negative: Math.round((counts.negative / total) * 100),
      positive: Math.round((counts.positive / total) * 100),
      neutral: 100 - Math.round((counts.negative / total) * 100) - Math.round((counts.positive / total) * 100),
      counts,
    }
  }),
  whatChanged: {
    currentLabel: 'Week of 22 Sep',
    previousLabel: 'Week of 15 Sep',
    rows: [
      { id: 'sample-grading', label: 'Unfair grading reports', kind: 'new', share: { previous: 0, current: 6 }, complaints: { previous: 0, current: 80 }, violations: 1, quote: 'Marks were changed without any explanation.' },
      { id: 'sample-wifi', label: 'Unreliable Wi-Fi in classrooms', kind: 'worse', share: { previous: 8, current: 14 }, complaints: { previous: 55, current: 79 }, violations: 0, quote: 'The Wi-Fi cut out twice during the online quiz.' },
      { id: 'sample-canteen', label: 'Canteen food and prices', kind: 'better', share: { previous: 9, current: 5 }, complaints: { previous: 60, current: 40 }, violations: 0, quote: null },
    ],
  },
  timelineEvents: [
    { id: 'sample-wifi-spike', date: iso(29), topicId: 'sample-wifi', bucketIndex: 4, count: 12, usual: 6 },
  ],
}

const SAMPLE_FEEDBACK = [
  'The Wi-Fi cut out twice during the online quiz.',
  'The lecturer explains difficult topics really clearly.',
  'Three assignments were due on the same Friday.',
  'More choices at the canteen this term, but prices are higher.',
  'Always happy to answer questions after class.',
  'Hard to follow slides when the connection keeps dropping.',
]

export const SAMPLE_RESPONSES: FormResponseAnalytics = {
  totalResponses: 124,
  lastResponseAt: iso(30),
  demographic: [
    {
      kind: 'single-choice',
      id: 'sample-year',
      title: 'Year of study',
      options: YEARS.map((label, i) => ({ id: label, label, value: [38, 33, 29, 24][i]! })),
    },
    {
      kind: 'single-choice',
      id: 'sample-program',
      title: 'Program of study',
      options: PROGRAMS.map((label, i) => ({ id: label, label, value: [58, 41, 25][i]! })),
    },
  ],
  feedback: [
    {
      kind: 'multi-choice',
      id: 'sample-channels',
      title: 'Which facilities did you use this term?',
      totalRespondents: 124,
      options: [
        { id: 'lib', label: 'Library', value: 96 },
        { id: 'lab', label: 'Computer labs', value: 71 },
        { id: 'canteen', label: 'Canteen', value: 88 },
        { id: 'cowork', label: 'Co-working space', value: 34 },
      ],
    },
    {
      kind: 'text',
      id: 'sample-feedback-text',
      title: 'Any other feedback?',
      responses: SAMPLE_FEEDBACK.map((text, i) => ({ text, respondentName: nameAt(i) })),
    },
  ],
}

export const SAMPLE_INDIVIDUAL: FormIndividualResponses = {
  fields: [
    { id: 1, title: 'Year of study', section: 'demographic', type: 'radio' },
    { id: 2, title: 'Program of study', section: 'demographic', type: 'radio' },
    { id: 3, title: 'Which facilities did you use this term?', section: 'feedback', type: 'checkbox' },
    { id: 4, title: 'Any other feedback?', section: 'feedback', type: 'textarea' },
  ],
  responses: SAMPLE_FEEDBACK.map((text, i) => ({
    id: -(i + 1),
    number: SAMPLE_FEEDBACK.length - i,
    submittedAt: iso(30 - i),
    respondentName: nameAt(i),
    answers: {
      1: [YEARS[i % YEARS.length]!],
      2: [PROGRAMS[i % PROGRAMS.length]!],
      3: i % 2 ? ['Library', 'Canteen'] : ['Computer labs'],
      4: [text],
    },
  })),
}
