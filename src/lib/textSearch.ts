/** A search box's value as matched: trimmed, case-folded. Empty means "no search". */
export function toNeedle(query: string): string {
  return query.trim().toLocaleLowerCase()
}

const SNIPPET_LEAD = 30
const SNIPPET_LENGTH = 90

/** A short excerpt of `text` around its first match of `needle` (… where cut), or null when it doesn't match. */
export function snippetOf(text: string | null | undefined, needle: string): string | null {
  if (!text || !needle) return null
  const at = text.toLocaleLowerCase().indexOf(needle)
  if (at < 0) return null
  const start = Math.max(0, at - SNIPPET_LEAD)
  const end = Math.min(text.length, start + SNIPPET_LENGTH)
  return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`
}

/** Case-insensitive substring match — works for Thai without word segmentation. */
export function includesNeedle(text: string | null | undefined, needle: string): boolean {
  return !!text && text.toLocaleLowerCase().includes(needle)
}
