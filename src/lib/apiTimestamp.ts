/**
 * The API's date columns are Postgres `timestamptz`, which come back as strings like
 * `"2026-06-08 09:55:00+07"` — a space instead of `T` and an hour-only offset, which
 * `new Date()` doesn't reliably accept. This turns them into strict ISO 8601 so every
 * displayed / compared time is the correct instant regardless of the viewer's zone.
 * A value with no zone at all (a legacy `timestamp` row) is read as UTC.
 */
export function asUtcIso(value: string | null): string | null {
  if (!value) return null
  const iso = value.includes('T') ? value : value.replace(' ', 'T')
  // Not a datetime we recognise — leave it untouched.
  if (!iso.includes('T')) return iso
  if (/Z$/.test(iso) || /[+-]\d\d:\d\d$/.test(iso)) return iso
  if (/[+-]\d\d$/.test(iso)) return `${iso}:00`
  if (/[+-]\d{4}$/.test(iso)) return `${iso.slice(0, -2)}:${iso.slice(-2)}`
  return `${iso}Z`
}
