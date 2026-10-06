import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { SentimentBreakdownTooltip } from './SentimentBreakdownTooltip'
import { SENTIMENT_COLORS } from './sentimentColors'

export type SentimentBarProps = {
  negative: number
  neutral: number
  positive: number
  maxValue?: number
  className?: string
  /** Shown at the top of the hover card (e.g. the topic name). */
  title?: string
}

export function SentimentBar({
  negative,
  neutral,
  positive,
  maxValue = 50,
  className = 'w-72',
  title,
}: SentimentBarProps) {
  const segments = [
    { key: 'negative', value: negative, color: SENTIMENT_COLORS.negative, label: 'Negative' },
    { key: 'neutral', value: neutral, color: SENTIMENT_COLORS.neutral, label: 'Neutral' },
    { key: 'positive', value: positive, color: SENTIMENT_COLORS.positive, label: 'Positive' },
  ].filter((segment) => segment.value > 0)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`flex h-6.25 items-center gap-0.5 ${className}`}
          aria-label={`Negative ${negative}, Neutral ${neutral}, Positive ${positive}, out of ${maxValue} feedback points`}
          role="img"
        >
          {segments.map((segment) => (
            <div
              className="h-full first:rounded-l-lg last:rounded-r-lg"
              key={segment.key}
              style={{
                backgroundColor: segment.color,
                width: `${(segment.value / maxValue) * 100}%`,
              }}
            />
          ))}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">
        <SentimentBreakdownTooltip
          negative={negative}
          neutral={neutral}
          positive={positive}
          title={title}
        />
      </TooltipContent>
    </Tooltip>
  )
}
