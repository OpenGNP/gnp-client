import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { SentimentBreakdownTooltip } from './SentimentBreakdownTooltip'
import { SENTIMENT_COLORS } from './sentimentColors'

export type SentimentGaugeProps = {
  score: number
  outOf: number
  negative: number
  neutral: number
  positive: number
  /** Whether negative/neutral/positive are raw counts (default) or already percentages. */
  unit?: 'count' | 'percent'
  /** Rendered width in px (the gauge scales with it); default 96. */
  width?: number
}

// Gauge geometry (SVG user units). A thick 270° ring opening at the bottom: it starts
// at 225° (bottom-left, 0) and runs clockwise over the top to -45° (bottom-right,
// outOf). The score sits in the opening, under the needle's pivot.
const WIDTH = 96
const CX = WIDTH / 2
const CY = 44
const OUTER_R = 40
const INNER_R = 19
const START_DEG = 225
const SWEEP_DEG = 270
const END_DEG = START_DEG - SWEEP_DEG
const HEIGHT = 86

function polar(radius: number, deg: number) {
  const rad = (deg * Math.PI) / 180
  return { x: CX + radius * Math.cos(rad), y: CY - radius * Math.sin(rad) }
}

/** Ring slice from `fromDeg` clockwise to `toDeg` (`fromDeg` > `toDeg`). */
function arcPath(fromDeg: number, toDeg: number) {
  const o1 = polar(OUTER_R, fromDeg)
  const o2 = polar(OUTER_R, toDeg)
  const i1 = polar(INNER_R, fromDeg)
  const i2 = polar(INNER_R, toDeg)
  const large = fromDeg - toDeg > 180 ? 1 : 0
  return [
    `M ${o1.x} ${o1.y}`,
    `A ${OUTER_R} ${OUTER_R} 0 ${large} 1 ${o2.x} ${o2.y}`,
    `L ${i2.x} ${i2.y}`,
    `A ${INNER_R} ${INNER_R} 0 ${large} 0 ${i1.x} ${i1.y}`,
    'Z',
  ].join(' ')
}

export function SentimentGauge({
  score,
  outOf,
  negative,
  neutral,
  positive,
  unit = 'count',
  width = WIDTH,
}: SentimentGaugeProps) {
  const segments = [
    { name: 'Negative', value: negative, color: SENTIMENT_COLORS.negative },
    { name: 'Neutral', value: neutral, color: SENTIMENT_COLORS.neutral },
    { name: 'Positive', value: positive, color: SENTIMENT_COLORS.positive },
  ].filter((segment) => segment.value > 0)
  const total = segments.reduce((sum, segment) => sum + segment.value, 0)

  // Slices sit edge to edge, left → right, sized by their share.
  let cursor = START_DEG
  const slices = segments.map((segment) => {
    const from = cursor
    cursor -= (SWEEP_DEG * segment.value) / total
    return { ...segment, d: arcPath(from, cursor) }
  })

  const clampedScore = Math.min(Math.max(score, 0), outOf)
  // Arrow needle: a shaft from the centre, then a triangular head reaching into the ring.
  const needleDeg = START_DEG - (clampedScore / outOf) * SWEEP_DEG
  const needleRad = (needleDeg * Math.PI) / 180
  const tip = polar(INNER_R + 7, needleDeg)
  const headBase = polar(INNER_R - 3, needleDeg)
  // Perpendicular to the needle, in screen coordinates (y points down).
  const perp = { x: Math.sin(needleRad) * 4, y: Math.cos(needleRad) * 4 }
  const arrowHead = [
    `${tip.x},${tip.y}`,
    `${headBase.x + perp.x},${headBase.y + perp.y}`,
    `${headBase.x - perp.x},${headBase.y - perp.y}`,
  ].join(' ')
  // "0" / outOf sit just below the ring's two ends.
  const startLabel = polar((OUTER_R + INNER_R) / 2, START_DEG)
  const endLabel = polar((OUTER_R + INNER_R) / 2, END_DEG)
  const labelY = polar(OUTER_R, START_DEG).y + 11

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <svg
          aria-label={`Sentiment score ${score} out of ${outOf}`}
          className="shrink-0"
          height={(HEIGHT * width) / WIDTH}
          role="img"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          width={width}
        >
          {total > 0 ? (
            slices.map((slice) => <path d={slice.d} fill={slice.color} key={slice.name} />)
          ) : (
            <path d={arcPath(START_DEG, END_DEG)} fill="#eef0f4" />
          )}

          <line
            stroke="#14181f"
            strokeLinecap="round"
            strokeWidth={2}
            x1={CX}
            x2={headBase.x}
            y1={CY}
            y2={headBase.y}
          />
          <polygon fill="#14181f" points={arrowHead} />

          <text
            fill="#14181f"
            fontSize={15}
            fontWeight={500}
            textAnchor="middle"
            x={CX}
            y={CY + 29}
          >
            {score}
          </text>
          <text fill="#929292" fontSize={10} textAnchor="middle" x={startLabel.x} y={labelY}>
            0
          </text>
          <text fill="#929292" fontSize={10} textAnchor="middle" x={endLabel.x} y={labelY}>
            {outOf}
          </text>
        </svg>
      </TooltipTrigger>
      <TooltipContent side="top">
        <SentimentBreakdownTooltip
          negative={negative}
          neutral={neutral}
          positive={positive}
          score={{ value: score, outOf }}
          unit={unit}
        />
      </TooltipContent>
    </Tooltip>
  )
}
