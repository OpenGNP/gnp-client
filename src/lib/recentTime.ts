type Dated = { lastOpenedAt?: string | null; updatedAt?: string | null; createdAt?: string | null }

/**
 * What puts a form in "Recent" (Home and the search dialog): whichever is later, when I
 * last opened it or when it last changed. Cards show this time with its label, so the
 * order always matches what they say.
 */
export function recentTime(form: Dated): { label: 'Opened' | 'Modified'; at: string | null } {
  const modified = form.updatedAt ?? form.createdAt ?? null
  return (Date.parse(form.lastOpenedAt ?? '') || 0) > (Date.parse(modified ?? '') || 0)
    ? { label: 'Opened', at: form.lastOpenedAt ?? null }
    : { label: 'Modified', at: modified }
}

export const recency = (form: Dated) => Date.parse(recentTime(form).at ?? '') || 0
