const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: 'seconds' },
  { amount: 60, unit: 'minutes' },
  { amount: 24, unit: 'hours' },
  { amount: 7, unit: 'days' },
  { amount: 4.34524, unit: 'weeks' },
  { amount: 12, unit: 'months' },
  { amount: Number.POSITIVE_INFINITY, unit: 'years' },
]

const relativeTimeFormat = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

/** "2 hours ago", "3 days ago", … Returns "—" for missing or unparseable input. */
export function formatRelativeTime(value: string | number | Date | null | undefined): string {
  if (value === null || value === undefined) {
    return '—'
  }

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  let duration = (date.getTime() - Date.now()) / 1000
  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return relativeTimeFormat.format(Math.round(duration), division.unit)
    }
    duration /= division.amount
  }

  return '—'
}
