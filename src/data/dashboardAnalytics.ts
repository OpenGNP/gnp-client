export type TopicKeyword = {
  text: string
  weight: 1 | 2 | 3
}

export type FeedbackSentiment = 'negative' | 'neutral' | 'positive'

export type FeedbackPoint = {
  id: string
  sentiment: FeedbackSentiment
  quote: string
  originalFeedback: string
  submittedAt: string
  department: string
  year: string
  gender: string
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
  feedbackSegment: FeedbackPoint[]
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

export type TrendTopicSeries = {
  id: string
  label: string
}

export type TopicMovement = {
  id: string
  label: string
  volumeChange: number
  positiveChange: number
  negativeChange: number
}

export type EmergingIssue = {
  id: string
  title: string
  description: string
  riskLabel: string
}

export type TrendTimelineEvent = {
  id: string
  date: string
  description: string
  change: number
  metricLabel: string
}

export type FormTrendAnalytics = {
  rangeLabel: string
  comparisonLabel: string
  topicVolumeSeries: TrendTopicSeries[]
  risingTopics: TopicMovement[]
  decliningTopics: TopicMovement[]
  emergingIssues: EmergingIssue[]
  timelineEvents: TrendTimelineEvent[]
}

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
  trend: FormTrendAnalytics
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
      feedbackSegment: [
        {
          id: 'verbal-harassment-fp-1',
          sentiment: 'negative',
          quote: 'I witnessed a classmate being verbally harassed and nothing was done about it.',
          originalFeedback:
            'It happened during a group project session in the second week. I reported it to the TA afterward but never heard back about any follow-up action being taken.',
          submittedAt: '2026-05-06',
          department: 'Computer Science',
          year: '2nd year',
          gender: 'Female',
        },
        {
          id: 'verbal-harassment-fp-2',
          sentiment: 'negative',
          quote: 'The harassment happened during a group project and the staff wasn’t informed in time.',
          originalFeedback:
            'By the time we escalated it, the semester was almost over, so nothing meaningful could be done. A faster reporting channel would help a lot.',
          submittedAt: '2026-05-14',
          department: 'Information Technology',
          year: '3rd year',
          gender: 'Male',
        },
        {
          id: 'verbal-harassment-fp-3',
          sentiment: 'neutral',
          quote: 'There should be a clearer process for reporting this kind of behavior.',
          originalFeedback:
            'Right now it’s unclear who to contact or what happens after a report is filed. A visible, well-communicated process would make people more likely to speak up.',
          submittedAt: '2026-05-20',
          department: 'Digital Media',
          year: '1st year',
          gender: 'Female',
        },
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
      feedbackSegment: [
        {
          id: 'exam-cheating-fp-1',
          sentiment: 'negative',
          quote: 'Cheating during the midterm was obvious but the proctor didn’t intervene.',
          originalFeedback:
            'Several students around me were clearly using notes on their phones. The proctor was at the front of the hall the whole time and didn’t walk around to check.',
          submittedAt: '2026-05-08',
          department: 'Computer Science',
          year: '2nd year',
          gender: 'Male',
        },
        {
          id: 'exam-cheating-fp-2',
          sentiment: 'neutral',
          quote: 'Stricter seating arrangements during exams would help reduce this.',
          originalFeedback:
            'Spacing desks further apart and mixing sections would make it much harder for anyone to see a neighbor’s answers.',
          submittedAt: '2026-05-15',
          department: 'Mechanical Engineering',
          year: '3rd year',
          gender: 'Male',
        },
        {
          id: 'exam-cheating-fp-3',
          sentiment: 'negative',
          quote: 'Some students used phones during the exam without consequence.',
          originalFeedback:
            'It’s discouraging to study hard for an exam knowing others are getting away with using their phones under the desk.',
          submittedAt: '2026-05-22',
          department: 'Business Administration',
          year: '1st year',
          gender: 'Female',
        },
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
      feedbackSegment: [
        {
          id: 'peer-abusing-fp-1',
          sentiment: 'negative',
          quote: 'A group member was constantly belittled during our project meetings.',
          originalFeedback:
            'Every time she suggested an idea, one of the other members would dismiss it in a dismissive or mocking tone. It made meetings really uncomfortable for everyone.',
          submittedAt: '2026-05-05',
          department: 'Digital Media',
          year: '2nd year',
          gender: 'Non-binary',
        },
        {
          id: 'peer-abusing-fp-2',
          sentiment: 'neutral',
          quote: 'Peer conflict resolution support would be helpful for group assignments.',
          originalFeedback:
            'A short mediation session with a TA present could resolve a lot of these issues before they escalate into something worse.',
          submittedAt: '2026-05-12',
          department: 'Computer Science',
          year: '3rd year',
          gender: 'Female',
        },
        {
          id: 'peer-abusing-fp-3',
          sentiment: 'negative',
          quote: 'Bullying in group chats went unaddressed by the course staff.',
          originalFeedback:
            'Screenshots of the messages were shared with the instructor, but no action seemed to follow, which discouraged others from reporting similar issues.',
          submittedAt: '2026-05-19',
          department: 'Information Technology',
          year: '1st year',
          gender: 'Male',
        },
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
      feedbackSegment: [
        {
          id: 'wifi-connectivity-fp-1',
          sentiment: 'negative',
          quote:
            'The Wi-Fi signal is often unstable and disconnects frequently, especially during online classes and meetings.',
          originalFeedback:
            'The Wi-Fi signal in the area has been quite unstable and disconnects frequently throughout the day. This issue is especially noticeable during online classes and virtual meetings, where the connection suddenly drops or becomes extremely slow without warning. As a result, video and audio often freeze, calls get interrupted, and it becomes difficult to communicate or follow discussions properly.',
          submittedAt: '2026-05-14',
          department: 'Computer Science',
          year: '3rd year',
          gender: 'Female',
        },
        {
          id: 'wifi-connectivity-fp-2',
          sentiment: 'negative',
          quote:
            'Frequent Wi-Fi interruptions and weak signal quality are affecting online learning and daily internet usage.',
          originalFeedback:
            'It’s not just during classes — even browsing course websites or submitting assignments takes much longer than it should because the connection keeps cutting in and out.',
          submittedAt: '2026-05-09',
          department: 'Information Technology',
          year: '2nd year',
          gender: 'Male',
        },
        {
          id: 'wifi-connectivity-fp-3',
          sentiment: 'positive',
          quote: 'Campus-wide Wi-Fi access is convenient when it’s working properly.',
          originalFeedback:
            'On the days the network is stable, having access everywhere on campus really does make studying between classes much easier.',
          submittedAt: '2026-05-21',
          department: 'Digital Media',
          year: '1st year',
          gender: 'Female',
        },
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
      feedbackSegment: [
        {
          id: 'lab-computer-performance-fp-1',
          sentiment: 'negative',
          quote: 'Lab computers freeze constantly during peak hours, wasting valuable class time.',
          originalFeedback:
            'During the busiest lab sessions, at least two or three machines in the room freeze up completely and need a restart, which eats into time we should be spending on the assignment.',
          submittedAt: '2026-05-07',
          department: 'Computer Science',
          year: '2nd year',
          gender: 'Male',
        },
        {
          id: 'lab-computer-performance-fp-2',
          sentiment: 'positive',
          quote: 'The new machines in Lab 3 run much faster than before.',
          originalFeedback:
            'Whoever upgraded Lab 3 recently did a great job — compile times and IDE loading are noticeably faster compared to the other labs.',
          submittedAt: '2026-05-16',
          department: 'Information Technology',
          year: '4th year',
          gender: 'Male',
        },
        {
          id: 'lab-computer-performance-fp-3',
          sentiment: 'neutral',
          quote: 'More lab hours would help since availability is limited.',
          originalFeedback:
            'The good machines get booked quickly near deadlines, so extending the lab’s open hours would give everyone a fairer chance to use them.',
          submittedAt: '2026-05-23',
          department: 'Mechanical Engineering',
          year: '1st year',
          gender: 'Female',
        },
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
      feedbackSegment: [
        {
          id: 'course-registration-system-fp-1',
          sentiment: 'negative',
          quote: 'The registration portal times out constantly during peak enrollment.',
          originalFeedback:
            'Right when registration opens, the system slows to a crawl and often times out before I can finish selecting my courses, forcing me to start over.',
          submittedAt: '2026-05-04',
          department: 'Business Administration',
          year: '2nd year',
          gender: 'Non-binary',
        },
        {
          id: 'course-registration-system-fp-2',
          sentiment: 'negative',
          quote: 'Error messages during registration don’t explain what went wrong.',
          originalFeedback:
            'I kept getting a generic error code with no explanation, so I had no idea whether the course was full, a prerequisite was missing, or something else entirely.',
          submittedAt: '2026-05-11',
          department: 'Computer Science',
          year: '1st year',
          gender: 'Female',
        },
        {
          id: 'course-registration-system-fp-3',
          sentiment: 'positive',
          quote: 'Registration was smooth this time compared to last semester.',
          originalFeedback:
            'I noticed the page loaded much faster this round and I was able to register for all my courses within a few minutes.',
          submittedAt: '2026-05-18',
          department: 'Information Technology',
          year: '3rd year',
          gender: 'Male',
        },
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
      feedbackSegment: [
        {
          id: 'internship-process-fp-1',
          sentiment: 'negative',
          quote: 'I never received updates on my internship application status.',
          originalFeedback:
            'After submitting my paperwork, I heard nothing for over a month and had to keep emailing the office just to check whether it was still being processed.',
          submittedAt: '2026-05-06',
          department: 'Business Administration',
          year: '3rd year',
          gender: 'Female',
        },
        {
          id: 'internship-process-fp-2',
          sentiment: 'neutral',
          quote: 'The approval process could be faster with clearer milestones.',
          originalFeedback:
            'A simple checklist or status tracker showing which stage the application is at would remove a lot of the uncertainty.',
          submittedAt: '2026-05-13',
          department: 'Computer Science',
          year: '4th year',
          gender: 'Male',
        },
        {
          id: 'internship-process-fp-3',
          sentiment: 'positive',
          quote: 'My advisor was very responsive throughout the internship process.',
          originalFeedback:
            'Every time I emailed with a question, my advisor replied within a day or two, which made the whole process much less stressful.',
          submittedAt: '2026-05-24',
          department: 'Information Technology',
          year: '3rd year',
          gender: 'Female',
        },
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
      feedbackSegment: [
        {
          id: 'csc101-difficulty-fp-1',
          sentiment: 'negative',
          quote: 'The pace of CSC101 is too fast for beginners with no prior coding experience.',
          originalFeedback:
            'We covered loops and functions in the same week, and for someone who had never written code before, it was very hard to keep up without extra practice.',
          submittedAt: '2026-05-05',
          department: 'Computer Science',
          year: '1st year',
          gender: 'Male',
        },
        {
          id: 'csc101-difficulty-fp-2',
          sentiment: 'neutral',
          quote: 'More practice sessions would help reinforce the concepts.',
          originalFeedback:
            'An extra optional lab hour each week focused purely on practice problems would help a lot of us solidify what’s taught in lecture.',
          submittedAt: '2026-05-12',
          department: 'Computer Science',
          year: '1st year',
          gender: 'Male',
        },
        {
          id: 'csc101-difficulty-fp-3',
          sentiment: 'positive',
          quote: 'The TA office hours really helped me catch up.',
          originalFeedback:
            'I was falling behind after missing a week of class, but the TA walked me through the material one-on-one and I was able to catch up before the midterm.',
          submittedAt: '2026-05-20',
          department: 'Information Technology',
          year: '1st year',
          gender: 'Female',
        },
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
      feedbackSegment: [
        {
          id: 'lab1-ador-fp-1',
          sentiment: 'negative',
          quote: 'Lab 1 has a persistent odor that makes long sessions uncomfortable.',
          originalFeedback:
            'It’s hard to focus on the assignment when the smell is noticeable the moment you walk in, especially during the longer three-hour sessions.',
          submittedAt: '2026-05-08',
          department: 'Computer Science',
          year: '2nd year',
          gender: 'Non-binary',
        },
        {
          id: 'lab1-ador-fp-2',
          sentiment: 'negative',
          quote: 'The ventilation in Lab 1 needs to be checked, the smell is noticeable.',
          originalFeedback:
            'I’m not sure if it’s the air conditioning or something else, but the room could really use better airflow.',
          submittedAt: '2026-05-15',
          department: 'Mechanical Engineering',
          year: '3rd year',
          gender: 'Female',
        },
        {
          id: 'lab1-ador-fp-3',
          sentiment: 'neutral',
          quote: 'Maybe rotating which lab is used could help while this gets fixed.',
          originalFeedback:
            'Until maintenance resolves it, alternating classes between Lab 1 and Lab 2 would at least reduce how often people are exposed to it.',
          submittedAt: '2026-05-21',
          department: 'Information Technology',
          year: '2nd year',
          gender: 'Male',
        },
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
      feedbackSegment: [
        {
          id: 'group-project-fp-1',
          sentiment: 'neutral',
          quote: 'Group work is valuable but grading should account for individual contribution.',
          originalFeedback:
            'A peer-evaluation component built into the grading rubric would make the final marks feel a lot fairer to everyone involved.',
          submittedAt: '2026-05-06',
          department: 'Business Administration',
          year: '2nd year',
          gender: 'Female',
        },
        {
          id: 'group-project-fp-2',
          sentiment: 'negative',
          quote: 'One member did none of the work but received the same grade.',
          originalFeedback:
            'We reached out to the instructor about it partway through, but by the time anything was addressed the project was already submitted.',
          submittedAt: '2026-05-14',
          department: 'Computer Science',
          year: '3rd year',
          gender: 'Male',
        },
        {
          id: 'group-project-fp-3',
          sentiment: 'positive',
          quote: 'Our group collaborated well and split tasks fairly.',
          originalFeedback:
            'We set up a shared task board in the first week and checked in twice weekly, which kept everyone accountable and made the workload feel balanced.',
          submittedAt: '2026-05-22',
          department: 'Digital Media',
          year: '2nd year',
          gender: 'Female',
        },
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
      feedbackSegment: [
        {
          id: 'verbal-harassment-ai-fp-1',
          sentiment: 'negative',
          quote: 'Reports of harassment keep surfacing in group settings without follow-up.',
          originalFeedback:
            'This is the second time I’ve heard a similar story from a different group of students, which makes me think it’s more widespread than the school realizes.',
          submittedAt: '2026-05-09',
          department: 'Digital Media',
          year: '3rd year',
          gender: 'Male',
        },
        {
          id: 'verbal-harassment-ai-fp-2',
          sentiment: 'neutral',
          quote: 'A clearer escalation path for harassment reports is needed.',
          originalFeedback:
            'It shouldn’t take multiple emails to figure out who is actually responsible for handling these complaints.',
          submittedAt: '2026-05-16',
          department: 'Computer Science',
          year: '2nd year',
          gender: 'Male',
        },
        {
          id: 'verbal-harassment-ai-fp-3',
          sentiment: 'negative',
          quote: 'Some comments in class discussions crossed the line and weren’t addressed.',
          originalFeedback:
            'The instructor was present when it happened but moved on without saying anything, which made it feel like it was acceptable.',
          submittedAt: '2026-05-23',
          department: 'Information Technology',
          year: '4th year',
          gender: 'Female',
        },
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
      feedbackSegment: [
        {
          id: 'cafeteria-food-quality-fp-1',
          sentiment: 'positive',
          quote: 'The new menu additions this semester are a big improvement.',
          originalFeedback:
            'The new stir-fry counter and the wider variety of vegetarian options have made lunch a lot more enjoyable this semester.',
          submittedAt: '2026-05-07',
          department: 'Business Administration',
          year: '1st year',
          gender: 'Non-binary',
        },
        {
          id: 'cafeteria-food-quality-fp-2',
          sentiment: 'negative',
          quote: 'Food quality is inconsistent between different cafeteria counters.',
          originalFeedback:
            'Some days the food from a certain counter is great and other days it’s clearly reheated or overcooked. It really depends on who’s working that shift.',
          submittedAt: '2026-05-15',
          department: 'Computer Science',
          year: '2nd year',
          gender: 'Female',
        },
        {
          id: 'cafeteria-food-quality-fp-3',
          sentiment: 'neutral',
          quote: 'Pricing is reasonable but variety could be better.',
          originalFeedback:
            'Prices are fair for a student budget, but the rotating menu repeats fairly often, so more variety across the week would be welcome.',
          submittedAt: '2026-05-22',
          department: 'Digital Media',
          year: '3rd year',
          gender: 'Male',
        },
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
      feedbackSegment: [
        {
          id: 'library-resources-fp-1',
          sentiment: 'positive',
          quote: 'Study rooms are quiet and easy to book online.',
          originalFeedback:
            'The booking system is straightforward and I’ve never had trouble finding a quiet room to study in, even close to exam periods.',
          submittedAt: '2026-05-05',
          department: 'Information Technology',
          year: '2nd year',
          gender: 'Female',
        },
        {
          id: 'library-resources-fp-2',
          sentiment: 'positive',
          quote: 'The digital library catalog makes finding resources simple.',
          originalFeedback:
            'Being able to search and access e-books remotely has saved me a lot of trips to campus just to grab a reference book.',
          submittedAt: '2026-05-13',
          department: 'Computer Science',
          year: '4th year',
          gender: 'Male',
        },
        {
          id: 'library-resources-fp-3',
          sentiment: 'neutral',
          quote: 'More outlets near the study desks would be helpful.',
          originalFeedback:
            'A lot of the desks on the second floor don’t have nearby power outlets, which is inconvenient for longer study sessions.',
          submittedAt: '2026-05-20',
          department: 'Digital Media',
          year: '1st year',
          gender: 'Female',
        },
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
      feedbackSegment: [
        {
          id: 'parking-availability-fp-1',
          sentiment: 'negative',
          quote: 'Parking is nearly impossible to find during the morning rush.',
          originalFeedback:
            'I’ve had to circle the lot for over fifteen minutes some mornings just to find a spot, which makes me late for my first class.',
          submittedAt: '2026-05-06',
          department: 'Mechanical Engineering',
          year: '3rd year',
          gender: 'Male',
        },
        {
          id: 'parking-availability-fp-2',
          sentiment: 'negative',
          quote: 'The lots closest to campus fill up before 8am.',
          originalFeedback:
            'Anyone arriving after 8 has to park in the overflow lot, which is a fifteen-minute walk from the main buildings.',
          submittedAt: '2026-05-14',
          department: 'Business Administration',
          year: '2nd year',
          gender: 'Male',
        },
        {
          id: 'parking-availability-fp-3',
          sentiment: 'neutral',
          quote: 'A shuttle from the overflow lot would ease the congestion.',
          originalFeedback:
            'Even a shuttle running every fifteen minutes during peak hours would make parking further away much more bearable.',
          submittedAt: '2026-05-21',
          department: 'Computer Science',
          year: '1st year',
          gender: 'Female',
        },
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
      feedbackSegment: [
        {
          id: 'online-exam-system-fp-1',
          sentiment: 'negative',
          quote: 'The exam system logged me out mid-submission and I lost my answers.',
          originalFeedback:
            'I was on the last question when the session timed out unexpectedly, and when I logged back in my earlier answers hadn’t been saved.',
          submittedAt: '2026-05-08',
          department: 'Computer Science',
          year: '2nd year',
          gender: 'Non-binary',
        },
        {
          id: 'online-exam-system-fp-2',
          sentiment: 'neutral',
          quote: 'Clearer instructions before the exam starts would reduce confusion.',
          originalFeedback:
            'A short walkthrough of how submission and time limits work, shown right before the exam begins, would help first-time users a lot.',
          submittedAt: '2026-05-16',
          department: 'Information Technology',
          year: '1st year',
          gender: 'Female',
        },
        {
          id: 'online-exam-system-fp-3',
          sentiment: 'positive',
          quote: 'The practice exam mode helped me get familiar with the interface.',
          originalFeedback:
            'Being able to try a mock exam beforehand meant I wasn’t figuring out the interface for the first time during the real exam.',
          submittedAt: '2026-05-23',
          department: 'Business Administration',
          year: '3rd year',
          gender: 'Male',
        },
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
      feedbackSegment: [
        {
          id: 'dormitory-conditions-fp-1',
          sentiment: 'neutral',
          quote: 'Maintenance requests take a while to get resolved.',
          originalFeedback:
            'I submitted a request about a leaking faucet almost two weeks ago and it still hasn’t been fixed, though I did get a confirmation email.',
          submittedAt: '2026-05-06',
          department: 'Business Administration',
          year: '1st year',
          gender: 'Female',
        },
        {
          id: 'dormitory-conditions-fp-2',
          sentiment: 'positive',
          quote: 'The common areas in the dorm are kept clean.',
          originalFeedback:
            'The cleaning staff do a great job keeping the shared kitchen and lounge tidy, even during busier weeks.',
          submittedAt: '2026-05-14',
          department: 'Digital Media',
          year: '2nd year',
          gender: 'Male',
        },
        {
          id: 'dormitory-conditions-fp-3',
          sentiment: 'negative',
          quote: 'Noise complaints after quiet hours aren’t enforced consistently.',
          originalFeedback:
            'Quiet hours are supposed to start at 11pm, but some floors are still loud well past midnight with no consequences.',
          submittedAt: '2026-05-21',
          department: 'Computer Science',
          year: '2nd year',
          gender: 'Female',
        },
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
      feedbackSegment: [
        {
          id: 'academic-advising-fp-1',
          sentiment: 'positive',
          quote: 'My advisor helped me plan my course schedule really well.',
          originalFeedback:
            'I met with my advisor at the start of the semester and they walked me through prerequisite chains I hadn’t noticed, which saved me from a scheduling conflict next year.',
          submittedAt: '2026-04-18',
          department: 'Business Administration',
          year: '2nd year',
          gender: 'Male',
        },
        {
          id: 'academic-advising-fp-2',
          sentiment: 'positive',
          quote: 'Advising appointments are easy to book and always helpful.',
          originalFeedback:
            'The online booking system for advising slots is straightforward, and every session I’ve had has left me with clear next steps.',
          submittedAt: '2026-05-02',
          department: 'Digital Media',
          year: '3rd year',
          gender: 'Male',
        },
        {
          id: 'academic-advising-fp-3',
          sentiment: 'neutral',
          quote: 'More advisors would reduce the wait time during peak registration.',
          originalFeedback:
            'During registration week the advising office gets very busy, and it can take a few days to get a slot even though each session itself is well run.',
          submittedAt: '2026-05-19',
          department: 'Computer Science',
          year: '1st year',
          gender: 'Female',
        },
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
      feedbackSegment: [
        {
          id: 'career-services-fp-1',
          sentiment: 'positive',
          quote: 'The resume workshop was extremely helpful before my internship search.',
          originalFeedback:
            'I attended the resume workshop right before applying to internships and the feedback I got on formatting and wording made a noticeable difference in my callback rate.',
          submittedAt: '2026-04-25',
          department: 'Computer Science',
          year: '3rd year',
          gender: 'Non-binary',
        },
        {
          id: 'career-services-fp-2',
          sentiment: 'positive',
          quote: 'Career fair connections led directly to my current internship.',
          originalFeedback:
            'I spoke with a recruiter at the spring career fair and that conversation turned into an interview and eventually the internship offer I have now.',
          submittedAt: '2026-05-08',
          department: 'Business Administration',
          year: '4th year',
          gender: 'Female',
        },
        {
          id: 'career-services-fp-3',
          sentiment: 'neutral',
          quote: 'More employer variety at career events would be great.',
          originalFeedback:
            'The career fairs are well organized, but most of the companies attending are in the same couple of industries — it would help to see more variety.',
          submittedAt: '2026-05-16',
          department: 'Digital Media',
          year: '2nd year',
          gender: 'Male',
        },
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
  trend: {
    rangeLabel: 'Last 30 days',
    comparisonLabel: 'vs Jan 1-Jan 31',
    topicVolumeSeries: [
      { id: 'wifi-connectivity', label: 'Wi-Fi connectivity' },
      { id: 'lab-computer-performance', label: 'Lab computer performance' },
      { id: 'course-registration-system', label: 'Course registration system' },
      { id: 'internship-process', label: 'Internship process' },
      { id: 'group-project', label: 'Group project' },
    ],
    risingTopics: [
      {
        id: 'wifi-connectivity',
        label: 'Wi-Fi connectivity',
        volumeChange: 42,
        positiveChange: 12,
        negativeChange: -21,
      },
      {
        id: 'internship-process',
        label: 'Internship process',
        volumeChange: 31,
        positiveChange: -23,
        negativeChange: 35,
      },
      {
        id: 'verbal-harassment',
        label: 'Verbal harassment',
        volumeChange: 28,
        positiveChange: 16,
        negativeChange: -15,
      },
      {
        id: 'workload-assignments',
        label: 'Workload / assignments',
        volumeChange: 16,
        positiveChange: -11,
        negativeChange: 12,
      },
      {
        id: 'exam-stress',
        label: 'Exam stress',
        volumeChange: 14,
        positiveChange: -2,
        negativeChange: 4,
      },
    ],
    decliningTopics: [
      {
        id: 'classroom-cleanliness',
        label: 'Classroom cleanliness',
        volumeChange: -40,
        positiveChange: 12,
        negativeChange: -21,
      },
      {
        id: 'lab-equipment',
        label: 'Lab equipment',
        volumeChange: -38,
        positiveChange: -23,
        negativeChange: 35,
      },
      {
        id: 'quick-tests',
        label: 'Quick tests',
        volumeChange: -22,
        positiveChange: 16,
        negativeChange: -15,
      },
      {
        id: 'vm-setup-process',
        label: 'VM setup process',
        volumeChange: -15,
        positiveChange: -11,
        negativeChange: 12,
      },
      {
        id: 'learning-materials',
        label: 'Learning materials',
        volumeChange: -9,
        positiveChange: -2,
        negativeChange: 4,
      },
    ],
    emergingIssues: [
      {
        id: 'mentions-spike',
        title: 'Rapid rise in negative mentions',
        description: 'Mentions increased by 18% in the last 7 days.',
        riskLabel: 'High risk',
      },
      {
        id: 'wifi-exam-week',
        title: 'Wi-Fi complaints during exam week',
        description: 'Significant spike detected between Jan 1 - Jan 19.',
        riskLabel: 'High risk',
      },
    ],
    timelineEvents: [
      {
        id: 'jan-18-network',
        date: '2026-01-18',
        description: 'Network instability reported in multiple departments.',
        change: 240,
        metricLabel: 'Wi-Fi complaints',
      },
      {
        id: 'jan-17-integrity',
        date: '2026-01-17',
        description: 'Exam integrity concern raised in CSC119.',
        change: 168,
        metricLabel: 'Exam cheating',
      },
      {
        id: 'jan-16-network',
        date: '2026-01-16',
        description: 'Network instability reported in multiple departments.',
        change: 112,
        metricLabel: 'Wi-Fi complaints',
      },
    ],
  },
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
