import type { TourStep } from '../../lib/productTour'

// Steps every tab's tour that shows these controls has in common.
const VIEWS_STEP: TourStep = {
  target: '[data-tour="dashboard-views"]',
  title: 'Four views of your responses',
  text: 'Themes groups feedback into topics with AI, Trend shows how they change over time, Response charts each question, and Individual lets you read every response.',
}
const SHOW_NAMES_STEP: TourStep = {
  // Only on forms that record names.
  target: '[data-tour="show-names"]',
  title: 'Hide names',
  text: 'Turn names off while screen-sharing or presenting. Exports then leave them out too. Try it.',
  interactive: true,
}
const SHARE_STEP: TourStep = {
  target: '[data-tour="share-results"]',
  title: 'Share with colleagues',
  text: "Let others view these results. They can't edit, share or delete the form.",
}

/**
 * The Dashboard's first-visit tour — only what isn't obvious from the page itself.
 * Steps are look-only unless `interactive`: clicking tabs, topics or filters would move the tour's targets.
 */
export const DASHBOARD_TOUR: TourStep[] = [
  VIEWS_STEP,
  {
    target: '[data-tour="dashboard-filters"]',
    title: 'Narrow it down',
    text: 'Pick a date range or a group of respondents (year, program…). Themes and Trend both follow it.',
  },
  {
    target: '#topic-list',
    title: 'Topics the AI found',
    text: 'Click a topic to read what people said about it. ⚠ marks feedback the AI flagged as a breach of law, ethics or morals.',
  },
  SHOW_NAMES_STEP,
  {
    target: '[data-tour="export"]',
    title: 'Export',
    text: 'Download the results as Excel, or a PDF report to share.',
  },
  SHARE_STEP,
]

/** The first time the Trend tab opens. */
export const TREND_TOUR: TourStep[] = [
  {
    target: '[data-tour="trend-bucket"]',
    title: 'Group by day, week or month',
    text: 'Choose how the charts below group your feedback over time. Auto picks a step that fits the date range.',
  },
  {
    target: '[data-tour="trend-chart"]',
    title: 'How each topic moves',
    text: 'Each line is a topic. Try it: hover to compare a point in time, and click a line to keep that topic highlighted.',
    interactive: true,
  },
  {
    target: '[data-tour="trend-topic-picker"]',
    title: 'Choose the topics on the chart',
    text: 'The chart shows a handful of topics at a time: the most mentioned, or those with violations. Open this to pick which ones (up to 8), or search for a topic.',
  },
  {
    target: '[data-tour="trend-movement"]',
    title: 'Rising and declining',
    text: 'Topics people are mentioning more, or less, than in the period before.',
  },
  {
    target: '[data-tour="trend-emerging"]',
    title: 'What to look at first',
    text: 'New or high-risk issues the AI picked up, and the moments a topic spiked.',
  },
]

/** The first time the Individual tab opens. */
export const INDIVIDUAL_TOUR: TourStep[] = [
  {
    target: '[data-tour="individual-search"]',
    title: 'Find a response',
    text: 'Search names or any answer, e.g. a word someone wrote in their feedback.',
  },
  {
    target: '[data-tour="individual-list"]',
    title: 'Read a whole response',
    text: 'Click a row to see every answer from that person, and step through with Previous / Next.',
  },
]

/** Response explains itself, so this one only runs from the Tour button. */
export const RESPONSE_TOUR: TourStep[] = [
  {
    target: '[data-tour="response-demographic"]',
    title: 'Demographic',
    text: 'Who responded, e.g. year or program.',
  },
  {
    target: '[data-tour="response-feedback"]',
    title: 'Feedback',
    text: 'What they answered, one card per question.',
  },
]
