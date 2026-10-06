import { SENTIMENT_COLORS } from './sentimentColors'

export type SentimentBreakdownTooltipProps = {
  title?: string
  negative: number
  neutral: number
  positive: number
  /** `count` = raw feedback points (percent is derived); `percent` = values are already %. */
  unit?: 'count' | 'percent'
  score?: { value: number; outOf: number }
}

/** Hover card body: per-sentiment count / share, plus an optional score line. */
export function SentimentBreakdownTooltip({
  title,
  negative,
  neutral,
  positive,
  unit = 'count',
  score,
}: SentimentBreakdownTooltipProps) {
  const total = negative + neutral + positive
  const rows = [
    { key: 'negative', label: 'Negative', value: negative },
    { key: 'neutral', label: 'Neutral', value: neutral },
    { key: 'positive', label: 'Positive', value: positive },
  ] as const

  return (
    <div className="flex flex-col gap-1.5">
      {title ? <span className="max-w-60 truncate font-medium text-[#14181f]">{title}</span> : null}
      {score ? (
        <span className="text-[#929292]">
          Score:{' '}
          <span className="font-medium text-[#14181f]">
            {score.value} / {score.outOf}
          </span>
        </span>
      ) : null}
      <div className="flex flex-col gap-1">
        {rows.map((row) => (
          <div className="flex items-center gap-2" key={row.key}>
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: SENTIMENT_COLORS[row.key] }}
            />
            <span className="text-[#3f4045]">{row.label}</span>
            <span className="ml-auto pl-4 font-medium text-[#14181f]">
              {unit === 'percent'
                ? `${row.value}%`
                : `${row.value} (${total ? Math.round((row.value / total) * 100) : 0}%)`}
            </span>
          </div>
        ))}
      </div>
      {unit === 'count' ? (
        <span className="border-t border-[#eef0f4] pt-1 text-[#929292]">
          Total: <span className="font-medium text-[#14181f]">{total} feedback points</span>
        </span>
      ) : null}
    </div>
  )
}
