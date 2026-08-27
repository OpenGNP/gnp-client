import { Cell, Pie, PieChart } from 'recharts'

import { SENTIMENT_COLORS } from './sentimentColors'

export type SentimentGaugeProps = {
  score: number
  outOf: number
  negative: number
  neutral: number
  positive: number
}

export function SentimentGauge({
  score,
  outOf,
  negative,
  neutral,
  positive,
}: SentimentGaugeProps) {
  const data = [
    { name: 'Negative', value: negative, color: SENTIMENT_COLORS.negative },
    { name: 'Neutral', value: neutral, color: SENTIMENT_COLORS.neutral },
    { name: 'Positive', value: positive, color: SENTIMENT_COLORS.positive },
  ]
  const clampedScore = Math.min(Math.max(score, 0), outOf)
  const needleAngle = 180 + (clampedScore / outOf) * 180

  return (
    <div
      className="h-12 w-[84px]"
      aria-label={`Overall sentiment score ${score} out of ${outOf}`}
      role="img"
    >
      <div className="relative h-16 w-28 origin-top-left scale-75">
        <PieChart height={64} width={112}>
          <Pie
            cx={52}
            cy={56}
            data={data}
            dataKey="value"
            endAngle={0}
            innerRadius={34}
            isAnimationActive={false}
            outerRadius={54}
            paddingAngle={2}
            startAngle={180}
            stroke="none"
          >
            {data.map((entry) => (
              <Cell fill={entry.color} key={entry.name} />
            ))}
          </Pie>
        </PieChart>
        <div
          className="absolute bottom-1.5 left-14 h-[1.5px] w-6 origin-left rounded-full bg-[#14181f]"
          style={{ transform: `rotate(${needleAngle}deg)` }}
        />
        <div className="absolute bottom-0.75 left-14 size-1.75 -translate-x-1/2 rounded-full bg-[#14181f]" />
        <span className="absolute bottom-2.5 left-0.75 text-[7px] text-[#929292]">0</span>
        <span className="absolute right-0.75 bottom-2.5 text-[7px] text-[#929292]">
          {outOf}
        </span>
        <span className="absolute top-4.5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-black">
          {score}
        </span>
      </div>
    </div>
  )
}
