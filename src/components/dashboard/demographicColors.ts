export const DEMOGRAPHIC_COLORS = [
  '#14B8A6',
  '#FACC15',
  '#F59E0B',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
] as const

export function getDemographicColor(index: number) {
  return DEMOGRAPHIC_COLORS[index % DEMOGRAPHIC_COLORS.length]
}
