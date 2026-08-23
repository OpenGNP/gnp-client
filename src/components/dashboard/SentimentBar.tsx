import { SENTIMENT_COLORS } from './sentimentColors'

export type SentimentBarProps = {
  negative: number
  neutral: number
  positive: number
  maxValue?: number
}

export function SentimentBar({
  negative,
  neutral,
  positive,
  maxValue = 50,
}: SentimentBarProps) {
  const segments = [
    { key: 'negative', value: negative, color: SENTIMENT_COLORS.negative, label: 'Negative' },
    { key: 'neutral', value: neutral, color: SENTIMENT_COLORS.neutral, label: 'Neutral' },
    { key: 'positive', value: positive, color: SENTIMENT_COLORS.positive, label: 'Positive' },
  ].filter((segment) => segment.value > 0)

  return (
    <div
      className="flex h-6.25 w-72 items-center gap-0.5"
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
          title={`${segment.label}: ${segment.value}`}
        />
      ))}
    </div>
  )
}
