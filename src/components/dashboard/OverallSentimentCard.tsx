import { cn } from '../../lib/utils'
import { SentimentGauge } from './SentimentGauge'
import { percentOf } from './sentimentScore'

const LEGEND = [
  { key: 'negative', label: 'Negative', dot: 'bg-[rgba(236,102,131,0.8)]' },
  { key: 'neutral', label: 'Neutral', dot: 'bg-[rgba(253,210,118,0.8)]' },
  { key: 'positive', label: 'Positive', dot: 'bg-[rgba(156,221,153,0.8)]' },
] as const

/** The Themes tab's "Overall sentiment" card: the score gauge and each sentiment's share. */
export function OverallSentimentCard({
  negative,
  neutral,
  positive,
  score,
  outOf,
}: {
  negative: number
  neutral: number
  positive: number
  score: number
  outOf: number
}) {
  const counts = { negative, neutral, positive }
  const total = negative + neutral + positive
  return (
    <div className="flex h-29.5 min-w-0 flex-col rounded-[10px] border border-[#e9eaed] bg-white px-3.75 pt-4">
      <p className="m-0 text-[12px] font-medium text-[#726f6f]">Overall sentiment</p>
      <div className="flex items-center gap-3">
        <SentimentGauge
          negative={negative}
          neutral={neutral}
          outOf={outOf}
          positive={positive}
          score={score}
          width={80}
        />
        <div className="flex flex-col gap-2 text-[12px]">
          {LEGEND.map((item) => (
            <span className="flex items-center gap-2" key={item.key}>
              <span className={cn('size-1.75 shrink-0 rounded-full', total === 0 ? 'bg-[#d2d8e5]' : item.dot)} />
              <span className="text-[#726f6f]">
                {item.label}:{' '}
                <span className={total === 0 ? 'text-[#726f6f]' : 'text-[#14181f]'}>
                  {percentOf(counts[item.key], total)}%
                </span>
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
