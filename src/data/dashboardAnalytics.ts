export type TopicSentiment = {
  id: string
  label: string
  negative: number
  neutral: number
  positive: number
  percentOfTotal: number
  isHighIntensity?: boolean
}

export type DemographicOption = {
  id: string
  label: string
  value: number
}

export type SingleChoiceBreakdown = {
  kind: 'single-choice'
  id: string
  title: string
  options: DemographicOption[]
}

export type MultiChoiceBreakdown = {
  kind: 'multi-choice'
  id: string
  title: string
  totalRespondents: number
  options: DemographicOption[]
}

export type TextResponseBreakdown = {
  kind: 'text'
  id: string
  title: string
  responses: string[]
}

export type DemographicBreakdown =
  | SingleChoiceBreakdown
  | MultiChoiceBreakdown
  | TextResponseBreakdown

export type FormDashboardAnalytics = {
  formId: string
  status: 'Active' | 'Closed'
  openDateRangeLabel: string
  lastUpdatedLabel: string
  title: string
  totalResponders: number
  responderDeltaLabel: string
  sentiment: {
    score: number
    outOf: number
    negative: number
    neutral: number
    positive: number
  }
  highIntenseTopics: TopicSentiment[]
  aiDiscoveredTopics: TopicSentiment[]
  demographics: DemographicBreakdown[]
  feedbackResponses: DemographicBreakdown[]
}

const csFocusGroupAnalytics: FormDashboardAnalytics = {
  formId: 'cs-feedback-architecture',
  status: 'Active',
  openDateRangeLabel: 'May 1 - May 31, 2026',
  lastUpdatedLabel: '2 hours ago',
  title: 'Discovered Themes of CS Focus Group Feedback 2026',
  totalResponders: 324,
  responderDeltaLabel: '+12 this week',
  sentiment: {
    score: 3.6,
    outOf: 5,
    negative: 40,
    neutral: 15,
    positive: 45,
  },
  highIntenseTopics: [
    {
      id: 'verbal-harassment',
      label: 'Verbal harassment',
      negative: 8,
      neutral: 3,
      positive: 0,
      percentOfTotal: 4.2,
      isHighIntensity: true,
    },
    {
      id: 'exam-cheating',
      label: 'Exam cheating',
      negative: 3,
      neutral: 4,
      positive: 0,
      percentOfTotal: 2.1,
      isHighIntensity: true,
    },
    {
      id: 'peer-abusing',
      label: 'Peer abusing',
      negative: 3,
      neutral: 2,
      positive: 0,
      percentOfTotal: 1.6,
      isHighIntensity: true,
    },
  ],
  aiDiscoveredTopics: [
    {
      id: 'wifi-connectivity',
      label: 'Wifi connectivity',
      negative: 20,
      neutral: 6,
      positive: 16,
      percentOfTotal: 12.2,
    },
    {
      id: 'lab-computer-performance',
      label: 'Lab computer performance',
      negative: 12,
      neutral: 9,
      positive: 18,
      percentOfTotal: 10.1,
    },
    {
      id: 'course-registration-system',
      label: 'Course registration system',
      negative: 14,
      neutral: 6,
      positive: 13,
      percentOfTotal: 9.5,
    },
    {
      id: 'internship-process',
      label: 'Internship process',
      negative: 13,
      neutral: 9,
      positive: 7,
      percentOfTotal: 8.2,
    },
    {
      id: 'csc101-difficulty',
      label: 'CSC101 difficulty',
      negative: 13,
      neutral: 6,
      positive: 6,
      percentOfTotal: 7.8,
    },
    {
      id: 'lab1-ador',
      label: 'Lab1 ador',
      negative: 17,
      neutral: 4,
      positive: 0,
      percentOfTotal: 6.3,
    },
    {
      id: 'group-project',
      label: 'Group project',
      negative: 6,
      neutral: 2,
      positive: 7,
      percentOfTotal: 5.9,
    },
    {
      id: 'verbal-harassment-ai',
      label: 'Verbal harassment',
      negative: 8,
      neutral: 3,
      positive: 0,
      percentOfTotal: 4.2,
      isHighIntensity: true,
    },
    {
      id: 'cafeteria-food-quality',
      label: 'Cafeteria food quality',
      negative: 7,
      neutral: 8,
      positive: 5,
      percentOfTotal: 3.8,
    },
    {
      id: 'library-resources',
      label: 'Library resources',
      negative: 4,
      neutral: 6,
      positive: 10,
      percentOfTotal: 3.5,
    },
    {
      id: 'parking-availability',
      label: 'Parking availability',
      negative: 9,
      neutral: 4,
      positive: 2,
      percentOfTotal: 3.1,
    },
    {
      id: 'online-exam-system',
      label: 'Online exam system',
      negative: 8,
      neutral: 5,
      positive: 3,
      percentOfTotal: 2.9,
    },
    {
      id: 'dormitory-conditions',
      label: 'Dormitory conditions',
      negative: 5,
      neutral: 6,
      positive: 4,
      percentOfTotal: 2.5,
    },
    {
      id: 'academic-advising',
      label: 'Academic advising',
      negative: 2,
      neutral: 5,
      positive: 8,
      percentOfTotal: 2.0,
    },
    {
      id: 'career-services',
      label: 'Career services',
      negative: 1,
      neutral: 3,
      positive: 9,
      percentOfTotal: 1.4,
    },
  ],
  demographics: [
    {
      kind: 'single-choice',
      id: 'year-of-study',
      title: 'Year of Study',
      options: [
        { id: 'year-1', label: 'Year 1', value: 45 },
        { id: 'year-2', label: 'Year 2', value: 5 },
        { id: 'year-3', label: 'Year 3', value: 11 },
        { id: 'year-4', label: 'Year 4', value: 20 },
      ],
    },
    {
      kind: 'multi-choice',
      id: 'gender',
      title: 'Gender',
      totalRespondents: 81,
      options: [
        { id: 'male', label: 'Male', value: 55 },
        { id: 'female', label: 'Female', value: 30 },
      ],
    },
  ],
  feedbackResponses: [
    {
      kind: 'text',
      id: 'curriculum-feedback',
      title: 'What do you think about current curriculum?',
      responses: [
        'The core courses feel outdated compared to what the industry actually uses right now.',
        'I like the balance between theory and hands-on labs, but the pace in year 2 is too fast.',
        'More electives around AI and data engineering would help a lot.',
        'Group projects are great, but grading feels inconsistent between sections.',
        'Would love more feedback loops during the semester instead of just at the end.',
        'The capstone project structure is solid and prepared me well for internships.',
      ],
    },
    {
      kind: 'text',
      id: 'facility-feedback',
      title: 'What would you like to share about facility?',
      responses: [
        'Lab computers in building 3 are slow and could use an upgrade.',
        'Wifi drops constantly in the south wing during peak hours.',
        'Study rooms are great, but there are never enough of them before exams.',
        'Cafeteria food options have improved a lot this semester.',
        'Air conditioning in the main lecture hall is way too cold.',
      ],
    },
  ],
}

const dashboardAnalyticsByFormId: Record<string, FormDashboardAnalytics> = {
  'cs-feedback-architecture': csFocusGroupAnalytics,
  'cs-focus-group': csFocusGroupAnalytics,
}

export function getDashboardAnalytics(
  formId: string | undefined,
): FormDashboardAnalytics | null {
  if (!formId) {
    return null
  }
  return dashboardAnalyticsByFormId[formId] ?? null
}
