/**
 * The API's date columns are Postgres `timestamp` **without time zone**, so they come
 * back as zone-less strings like `"2026-06-08 02:55:00"`. Values are always stored as
 * UTC, so they must be read back as UTC — otherwise `new Date(zoneless)` in the
 * browser parses them as *local* time and every displayed / compared time is off by
 * the viewer's UTC offset.
 *
 * (The real fix is migrating those columns to `timestamptz`; until then, every read
 * path normalises here.)
 */
export function asUtcIso(value: string | null): string | null {
  if (!value) return null
  const withT = value.includes('T') ? value : value.replace(' ', 'T')
  // Not a datetime we recognise, or already carries a zone — leave it untouched.
  if (!withT.includes('T') || /Z$|[+-]\d\d(:?\d\d)?$/.test(withT)) return withT
  return `${withT}Z`
}
