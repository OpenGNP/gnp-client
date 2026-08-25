export type TopicKeyword = {
  text: string
  weight: 1 | 2 | 3
}

export type TopicSentiment = {
  id: string
  label: string
  negative: number
  neutral: number
  positive: number
  percentOfTotal: number
  isHighIntensity?: boolean
  aiSummary: string
  keywords: TopicKeyword[]
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
      aiSummary:
        'Multiple respondents describe experiencing or witnessing verbal harassment, with several noting it went unaddressed by staff. Concern is high given the small but consistent volume of reports.',
      keywords: [
        { text: 'harassment', weight: 3 },
        { text: 'reported', weight: 2 },
        { text: 'staff response', weight: 2 },
        { text: 'unsafe', weight: 2 },
        { text: 'repeated', weight: 1 },
        { text: 'ignored', weight: 1 },
      ],
    },
    {
      id: 'exam-cheating',
      label: 'Exam cheating',
      negative: 3,
      neutral: 4,
      positive: 0,
      percentOfTotal: 2.1,
      isHighIntensity: true,
      aiSummary:
        'Respondents flag instances of cheating during exams and call for stricter proctoring. Sentiment is mixed between frustration and calls for fairer enforcement.',
      keywords: [
        { text: 'cheating', weight: 3 },
        { text: 'proctoring', weight: 2 },
        { text: 'unfair', weight: 2 },
        { text: 'enforcement', weight: 2 },
        { text: 'exam hall', weight: 1 },
        { text: 'integrity', weight: 1 },
      ],
    },
    {
      id: 'peer-abusing',
      label: 'Peer abusing',
      negative: 3,
      neutral: 2,
      positive: 0,
      percentOfTotal: 1.6,
      isHighIntensity: true,
      aiSummary:
        'A small number of respondents report abusive behavior from peers, mostly in group settings. Feedback suggests better reporting channels are needed.',
      keywords: [
        { text: 'peer conflict', weight: 3 },
        { text: 'group work', weight: 2 },
        { text: 'bullying', weight: 2 },
        { text: 'reporting', weight: 1 },
        { text: 'support', weight: 1 },
      ],
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
      aiSummary:
        'Students report mixed experiences with the university Wi-Fi. While campus-wide access is appreciated, many experience slow speeds, unstable connections, and weak coverage that disrupt online learning and assignment submissions. Students want faster and more reliable internet access.',
      keywords: [
        { text: 'Disconnect', weight: 3 },
        { text: 'online class', weight: 2 },
        { text: 'slow', weight: 2 },
        { text: 'stable', weight: 2 },
        { text: 'website', weight: 2 },
        { text: 'freeze', weight: 1 },
        { text: 'fast', weight: 1 },
        { text: 'computer', weight: 1 },
        { text: 'classes', weight: 1 },
        { text: 'communicate', weight: 1 },
      ],
    },
    {
      id: 'lab-computer-performance',
      label: 'Lab computer performance',
      negative: 12,
      neutral: 9,
      positive: 18,
      percentOfTotal: 10.1,
      aiSummary:
        'Lab computers are frequently described as slow or outdated, especially during peak lab hours. Students ask for hardware upgrades and more available machines.',
      keywords: [
        { text: 'slow computers', weight: 3 },
        { text: 'outdated', weight: 2 },
        { text: 'lab hours', weight: 2 },
        { text: 'upgrade', weight: 2 },
        { text: 'crashes', weight: 1 },
        { text: 'availability', weight: 1 },
      ],
    },
    {
      id: 'course-registration-system',
      label: 'Course registration system',
      negative: 14,
      neutral: 6,
      positive: 13,
      percentOfTotal: 9.5,
      aiSummary:
        'Feedback centers on the registration system being difficult to use during peak enrollment, with frequent timeouts and confusing error messages.',
      keywords: [
        { text: 'registration', weight: 3 },
        { text: 'timeout', weight: 2 },
        { text: 'confusing', weight: 2 },
        { text: 'errors', weight: 2 },
        { text: 'peak load', weight: 1 },
        { text: 'slow', weight: 1 },
      ],
    },
    {
      id: 'internship-process',
      label: 'Internship process',
      negative: 13,
      neutral: 9,
      positive: 7,
      percentOfTotal: 8.2,
      aiSummary:
        'Respondents describe the internship application and approval process as slow and unclear, with limited communication on status updates.',
      keywords: [
        { text: 'slow process', weight: 3 },
        { text: 'unclear steps', weight: 2 },
        { text: 'approval', weight: 2 },
        { text: 'communication', weight: 2 },
        { text: 'paperwork', weight: 1 },
        { text: 'delays', weight: 1 },
      ],
    },
    {
      id: 'csc101-difficulty',
      label: 'CSC101 difficulty',
      negative: 13,
      neutral: 6,
      positive: 6,
      percentOfTotal: 7.8,
      aiSummary:
        'Students find CSC101 challenging, citing a fast pace and limited hands-on practice relative to the material covered.',
      keywords: [
        { text: 'difficult', weight: 3 },
        { text: 'fast pace', weight: 2 },
        { text: 'workload', weight: 2 },
        { text: 'practice', weight: 2 },
        { text: 'support', weight: 1 },
        { text: 'concepts', weight: 1 },
      ],
    },
    {
      id: 'lab1-ador',
      label: 'Lab1 ador',
      negative: 17,
      neutral: 4,
      positive: 0,
      percentOfTotal: 6.3,
      aiSummary:
        'Respondents mention persistent odor issues in Lab 1 that make extended sessions uncomfortable.',
      keywords: [
        { text: 'odor', weight: 3 },
        { text: 'ventilation', weight: 2 },
        { text: 'uncomfortable', weight: 2 },
        { text: 'lab 1', weight: 2 },
        { text: 'maintenance', weight: 1 },
      ],
    },
    {
      id: 'group-project',
      label: 'Group project',
      negative: 6,
      neutral: 2,
      positive: 7,
      percentOfTotal: 5.9,
      aiSummary:
        'Group project feedback is mixed — collaboration is valued, but grading consistency and uneven workload distribution are common concerns.',
      keywords: [
        { text: 'uneven workload', weight: 3 },
        { text: 'teamwork', weight: 2 },
        { text: 'grading', weight: 2 },
        { text: 'free riders', weight: 2 },
        { text: 'collaboration', weight: 1 },
      ],
    },
    {
      id: 'verbal-harassment-ai',
      label: 'Verbal harassment',
      negative: 8,
      neutral: 3,
      positive: 0,
      percentOfTotal: 4.2,
      isHighIntensity: true,
      aiSummary:
        'AI-clustered reports again surface verbal harassment concerns, consistent with directly flagged cases elsewhere in the data.',
      keywords: [
        { text: 'harassment', weight: 3 },
        { text: 'repeated', weight: 2 },
        { text: 'unsafe', weight: 2 },
        { text: 'staff response', weight: 1 },
        { text: 'reported', weight: 1 },
      ],
    },
    {
      id: 'cafeteria-food-quality',
      label: 'Cafeteria food quality',
      negative: 7,
      neutral: 8,
      positive: 5,
      percentOfTotal: 3.8,
      aiSummary:
        'Opinions on cafeteria food are split — several respondents praise recent menu improvements while others cite inconsistent quality.',
      keywords: [
        { text: 'inconsistent', weight: 3 },
        { text: 'menu', weight: 2 },
        { text: 'improved', weight: 2 },
        { text: 'pricing', weight: 1 },
        { text: 'variety', weight: 1 },
      ],
    },
    {
      id: 'library-resources',
      label: 'Library resources',
      negative: 4,
      neutral: 6,
      positive: 10,
      percentOfTotal: 3.5,
      aiSummary:
        'Respondents generally view library resources positively, highlighting availability of study rooms and digital materials.',
      keywords: [
        { text: 'study rooms', weight: 3 },
        { text: 'digital access', weight: 2 },
        { text: 'quiet space', weight: 2 },
        { text: 'helpful staff', weight: 1 },
        { text: 'resources', weight: 1 },
      ],
    },
    {
      id: 'parking-availability',
      label: 'Parking availability',
      negative: 9,
      neutral: 4,
      positive: 2,
      percentOfTotal: 3.1,
      aiSummary:
        'Parking availability is a recurring frustration, especially during morning arrival times near main buildings.',
      keywords: [
        { text: 'limited spots', weight: 3 },
        { text: 'morning rush', weight: 2 },
        { text: 'far lots', weight: 2 },
        { text: 'permits', weight: 1 },
        { text: 'crowded', weight: 1 },
      ],
    },
    {
      id: 'online-exam-system',
      label: 'Online exam system',
      negative: 8,
      neutral: 5,
      positive: 3,
      percentOfTotal: 2.9,
      aiSummary:
        'The online exam system draws mixed feedback, with some technical hiccups reported around submission and timing.',
      keywords: [
        { text: 'timing issues', weight: 3 },
        { text: 'submission', weight: 2 },
        { text: 'technical', weight: 2 },
        { text: 'reliability', weight: 1 },
        { text: 'instructions', weight: 1 },
      ],
    },
    {
      id: 'dormitory-conditions',
      label: 'Dormitory conditions',
      negative: 5,
      neutral: 6,
      positive: 4,
      percentOfTotal: 2.5,
      aiSummary:
        'Dormitory feedback is mixed, with comments on maintenance response times and shared facility upkeep.',
      keywords: [
        { text: 'maintenance', weight: 3 },
        { text: 'shared facilities', weight: 2 },
        { text: 'response time', weight: 2 },
        { text: 'cleanliness', weight: 1 },
        { text: 'noise', weight: 1 },
      ],
    },
    {
      id: 'academic-advising',
      label: 'Academic advising',
      negative: 2,
      neutral: 5,
      positive: 8,
      percentOfTotal: 2.0,
      aiSummary:
        'Academic advising feedback leans positive, with respondents appreciating availability and clarity of guidance from advisors.',
      keywords: [
        { text: 'helpful advisors', weight: 3 },
        { text: 'availability', weight: 2 },
        { text: 'clear guidance', weight: 2 },
        { text: 'scheduling', weight: 1 },
        { text: 'planning', weight: 1 },
      ],
    },
    {
      id: 'career-services',
      label: 'Career services',
      negative: 1,
      neutral: 3,
      positive: 9,
      percentOfTotal: 1.4,
      aiSummary:
        'Career services received largely positive feedback, particularly around resume support and employer connections.',
      keywords: [
        { text: 'resume help', weight: 3 },
        { text: 'employer events', weight: 2 },
        { text: 'job search', weight: 2 },
        { text: 'supportive', weight: 1 },
        { text: 'guidance', weight: 1 },
      ],
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
        'The core courses feel outdated compared to what the industry actually uses right now. Honestly, I think the department needs to sit down with recent alumni working in the field and rebuild the syllabus from the ground up, because a lot of what we spend weeks on in class gets replaced by a single afternoon of onboarding at an actual job, while the things that would genuinely help — like working with real production codebases, dealing with legacy systems, or writing tests for someone else\'s code — barely get any attention at all across the whole four years.',
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
