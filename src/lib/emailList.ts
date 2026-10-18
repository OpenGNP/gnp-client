const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Emails out of pasted text — a column from Excel, a comma/semicolon list, or an
 * Outlook "Name <a@b.com>" line. `invalid` keeps what looked like an entry but isn't an email.
 */
export function parseEmails(text: string): { valid: string[]; invalid: string[] } {
  const valid: string[] = []
  const invalid: string[] = []
  for (const raw of text.split(/[\s,;]+/)) {
    const token = raw.replace(/^[<("']+|[>)"']+$/g, '').trim()
    if (!token) continue
    if (EMAIL_PATTERN.test(token)) valid.push(token)
    // Bits of an Outlook display name ("Somchai", "Jaidee") aren't mistakes.
    else if (token.includes('@')) invalid.push(token)
  }
  return { valid, invalid }
}
