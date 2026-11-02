import type { FormIndividualResponses, FormThemeAnalytics } from '../../api/analytics'
import type { FeedbackPoint, TopicSentiment } from '../../data/dashboardAnalytics'
import { sentimentScore } from './sentimentScore'

/*
 * What the server does for a real form, done on the page for /demo's sample data:
 * the Themes filters and the Response tab's CSV. Never used for real data.
 */

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

/**
 * Themes under the date range and demographic filter. A sample topic carries a few example
 * comments for a larger total, so its counts shrink by the share of its comments that match:
 * illustrative, not exact.
 */
export function filterDemoThemes(
  themes: FormThemeAnalytics,
  range: { from: string; to: string } | null,
  demo: Record<string, string[]>,
): FormThemeAnalytics {
  const chosen = Object.entries(demo).filter(([, values]) => values.length > 0)
  if (!range && chosen.length === 0) return themes
  const from = range ? Date.parse(range.from) : -Infinity
  const to = range ? Date.parse(range.to) : Infinity
  const matches = (point: FeedbackPoint) => {
    const at = Date.parse(point.submittedAt)
    if (at < from || at > to) return false
    return chosen.every(([label, values]) =>
      values.includes(point.demographics.find((entry) => entry.label === label)?.value ?? ''),
    )
  }

  let kept = 0
  let all = 0
  const narrow = (topic: TopicSentiment): TopicSentiment => {
    const feedbackSegment = topic.feedbackSegment.filter(matches)
    const share = topic.feedbackSegment.length ? feedbackSegment.length / topic.feedbackSegment.length : 0
    const scale = (n: number) => Math.round(n * share)
    return {
      ...topic,
      feedbackSegment,
      negative: scale(topic.negative),
      neutral: scale(topic.neutral),
      positive: scale(topic.positive),
      hasViolation: feedbackSegment.some((point) => point.violation),
    }
  }
  for (const topic of themes.aiDiscoveredTopics) {
    all += topic.feedbackSegment.length
    kept += topic.feedbackSegment.filter(matches).length
  }
  const narrowed = themes.aiDiscoveredTopics.map(narrow).filter((topic) => topic.feedbackSegment.length > 0)
  const mentions = (topic: TopicSentiment) => topic.negative + topic.neutral + topic.positive
  const total = narrowed.reduce((sum, topic) => sum + mentions(topic), 0)
  const topics = narrowed.map((topic) => ({
    ...topic,
    percentOfTotal: total ? Math.round((mentions(topic) / total) * 100) : 0,
  }))
  const counts = {
    negative: topics.reduce((sum, topic) => sum + topic.negative, 0),
    neutral: topics.reduce((sum, topic) => sum + topic.neutral, 0),
    positive: topics.reduce((sum, topic) => sum + topic.positive, 0),
  }
  return {
    ...themes,
    from: range?.from ?? themes.from,
    to: range?.to ?? themes.to,
    rangeLabel: range ? `${shortDate(range.from)} – ${shortDate(range.to)}` : themes.rangeLabel,
    totalResponders: all ? Math.round((themes.totalResponders * kept) / all) : 0,
    // "+6 today" is about the whole sample; under a filter it would be made up.
    responderDelta: 0,
    sentiment: { ...themes.sentiment, ...counts, score: sentimentScore(counts) },
    aiDiscoveredTopics: topics,
    violationTopics: topics.filter((topic) => topic.hasViolation),
  }
}

const cell = (value: string | number) => {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** One row per sample response, one column per question, like the real CSV export. */
export function demoResponsesCsv(data: FormIndividualResponses, includeNames: boolean): Blob {
  const header = ['Response #', 'Submitted', ...(includeNames ? ['Name'] : []), ...data.fields.map((field) => field.title)]
  const rows = [...data.responses]
    .sort((a, b) => a.number - b.number)
    .map((response) => [
      response.number,
      response.submittedAt ?? '',
      ...(includeNames ? [response.respondentName ?? ''] : []),
      ...data.fields.map((field) => (response.answers[field.id] ?? []).join('; ')),
    ])
  // The byte-order mark lets Excel read the file as UTF-8 (Thai names, curly quotes).
  const text = [header, ...rows].map((row) => row.map(cell).join(',')).join('\r\n')
  return new Blob(['\ufeff' + text], { type: 'text/csv;charset=utf-8' })
}
