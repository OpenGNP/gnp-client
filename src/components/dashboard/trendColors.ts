/**
 * Line colours for the Trend "Topic Trends (by volume)" chart, indexed by the
 * topic's position in the charted set. First five are the Figma palette; the last
 * three cover the extra slots the topic picker allows (cap 8).
 */
export const TOPIC_TREND_COLORS = [
  '#7156F1',
  '#177CFD',
  '#51C66D',
  '#FEB535',
  '#F63B56',
  '#0CA678',
  '#E8590C',
  '#9C36B5',
] as const

/** Topic id → its line colour, by position in the charted set. */
export const topicColorMap = (series: { id: string }[]) =>
  new Map(series.map((entry, index) => [entry.id, TOPIC_TREND_COLORS[index % TOPIC_TREND_COLORS.length]!]))

/** Max topic lines the chart / picker allows at once. */
export const TREND_SERIES_MAX = 8
