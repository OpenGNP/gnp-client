import type { FormThemeAnalytics } from '../../api/analytics'
import type { FeedbackPoint, TopicSentiment } from '../../data/dashboardAnalytics'
import { SentimentGauge } from '../dashboard/SentimentGauge'
import { SENTIMENT_COLORS } from '../dashboard/sentimentColors'

const TOP_TOPICS = 5
const QUOTES_PER_TOPIC = 3
const UNCATEGORISED_ID = 'uncategorised'

const total = (topic: { negative: number; neutral: number; positive: number }) =>
  topic.negative + topic.neutral + topic.positive
const percent = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0)

// Flagged first, then the most negative — what a reader of the report should see.
const quoteRank = (point: FeedbackPoint) =>
  point.violation ? 0 : point.sentiment === 'negative' ? 1 : point.sentiment === 'neutral' ? 2 : 3

/** A plain stacked bar (no hover card), scaled to `max`. */
function Bar({ topic, max }: { topic: TopicSentiment; max: number }) {
  return (
    <div className="flex h-3 w-full gap-px">
      {(['negative', 'neutral', 'positive'] as const)
        .filter((key) => topic[key] > 0)
        .map((key) => (
          <div
            className="h-full first:rounded-l last:rounded-r"
            key={key}
            style={{ backgroundColor: SENTIMENT_COLORS[key], width: `${(topic[key] / max) * 100}%` }}
          />
        ))}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7 break-inside-auto">
      <h2 className="m-0 mb-3 border-b-2 border-[#1e55c5] pb-1 text-[15px] font-bold text-[#1e55c5]">{title}</h2>
      {children}
    </section>
  )
}

/**
 * The Themes tab as a printable A4 summary — not every feedback point (that's the
 * xlsx), but what someone reading a report needs: the overall picture, every topic's
 * sentiment, the top topics with their AI summary and a few quotes, and violations.
 * Respondent names are never printed.
 */
export function ThemesReport({
  formTitle,
  themes,
  scope,
}: {
  formTitle: string
  themes: FormThemeAnalytics
  /** The filters the numbers are limited to; empty = all feedback. */
  scope: string[]
}) {
  const topics = themes.aiDiscoveredTopics
  const ranked = topics.filter((topic) => topic.id !== UNCATEGORISED_ID)
  const max = Math.max(1, ...topics.map(total))
  const { negative, neutral, positive } = themes.sentiment
  const analysed = negative + neutral + positive
  const topCount = Math.min(TOP_TOPICS, ranked.length)
  const topTitle = topCount === 1 ? 'Top topic' : `Top ${topCount} topics`
  const violations = topics.reduce((sum, topic) => sum + topic.feedbackSegment.filter((p) => p.violation).length, 0)

  return (
    <article className="text-[12px] leading-[1.5] text-[#14181f]">
      <header className="border-b border-[#e9eaed] pb-4">
        <p className="m-0 text-[11px] font-semibold tracking-[0.6px] text-[#929292] uppercase">AI analysis report</p>
        <h1 className="m-0 mt-1 text-[22px] font-bold">{formTitle}</h1>
        <p className="m-0 mt-1 text-[#726f6f]">
          {scope.length > 0 ? scope.join(' · ') : `All feedback · ${themes.rangeLabel}`}
        </p>
        <p className="m-0 mt-0.5 text-[11px] text-[#929292]">
          Generated {new Date().toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
        </p>
      </header>

      <div className="mt-5 flex items-center gap-8 break-inside-avoid">
        <SentimentGauge
          negative={negative}
          neutral={neutral}
          outOf={themes.sentiment.outOf}
          positive={positive}
          score={themes.sentiment.score}
        />
        <dl className="m-0 grid grid-cols-2 gap-x-8 gap-y-2">
          {[
            ['Respondents', themes.totalResponders],
            ['Analysed feedback', analysed],
            ['Topics', ranked.length],
            ['Flagged as violation', violations],
            ['Negative', `${percent(negative, analysed)}%`],
            ['Positive', `${percent(positive, analysed)}%`],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-[11px] text-[#929292]">{label}</dt>
              <dd className="m-0 text-[16px] font-bold">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <Section title="Topics">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left text-[10px] text-[#929292] uppercase">
              <th className="pb-1 font-semibold">Topic</th>
              <th className="w-16 pb-1 text-right font-semibold">Mentions</th>
              <th className="w-[38%] px-3 pb-1 font-semibold">Sentiment</th>
              <th className="w-16 pb-1 text-right font-semibold">Negative</th>
            </tr>
          </thead>
          <tbody>
            {topics.map((topic) => (
              <tr className="break-inside-avoid border-t border-[#f0f1f4]" key={topic.id}>
                <td className="py-1.5 pr-2">
                  {topic.label}
                  {topic.hasViolation ? <span className="ml-1 text-[#c1121f]">⚠</span> : null}
                </td>
                <td className="py-1.5 text-right">{total(topic)}</td>
                <td className="px-3 py-1.5">
                  <Bar max={max} topic={topic} />
                </td>
                <td className="py-1.5 text-right">{percent(topic.negative, total(topic))}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="m-0 mt-2 flex gap-4 text-[10px] text-[#929292]">
          {(['negative', 'neutral', 'positive'] as const).map((key) => (
            <span className="flex items-center gap-1 capitalize" key={key}>
              <span className="inline-block size-2.5 rounded-sm" style={{ backgroundColor: SENTIMENT_COLORS[key] }} />
              {key}
            </span>
          ))}
          <span>⚠ contains feedback flagged as a violation</span>
        </p>
      </Section>

      <Section title={topTitle}>
        {ranked.slice(0, TOP_TOPICS).map((topic) => {
          const quotes = [...topic.feedbackSegment].sort((a, b) => quoteRank(a) - quoteRank(b)).slice(0, QUOTES_PER_TOPIC)
          return (
            <div className="mb-4 break-inside-avoid rounded-lg border border-[#e9eaed] p-3" key={topic.id}>
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="m-0 text-[13px] font-bold">{topic.label}</h3>
                <span className="shrink-0 text-[11px] text-[#726f6f]">
                  {total(topic)} mentions · {percent(topic.negative, total(topic))}% negative
                </span>
              </div>
              <p className="m-0 mt-1 text-[#3f4045]">{topic.aiSummary}</p>
              <ul className="m-0 mt-2 list-none p-0">
                {quotes.map((point) => (
                  <li className="mt-1 border-l-2 pl-2 text-[11px] text-[#3f4045]" key={point.id} style={{ borderColor: SENTIMENT_COLORS[point.sentiment] }}>
                    “{point.quote}”{point.violation ? <span className="ml-1 text-[#c1121f]">⚠ violation</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </Section>

      {themes.violationTopics.length > 0 ? (
        <Section title="Flagged as violations">
          <p className="m-0 mb-2 text-[11px] text-[#726f6f]">
            Feedback the AI flagged as reporting a breach of law, ethics or morals. Flagged automatically — the AI can be wrong.
          </p>
          {themes.violationTopics.map((topic) => (
            <div className="mb-3 break-inside-avoid" key={topic.id}>
              <h3 className="m-0 text-[12px] font-bold">{topic.label}</h3>
              <ul className="m-0 mt-1 list-none p-0">
                {topic.feedbackSegment
                  .filter((point) => point.violation)
                  .map((point) => (
                    <li className="mt-1 border-l-2 border-[#c1121f] pl-2 text-[11px] text-[#3f4045]" key={point.id}>
                      “{point.quote}”
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </Section>
      ) : null}
    </article>
  )
}
