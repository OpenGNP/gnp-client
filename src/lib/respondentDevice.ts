const STORAGE_KEY = 'gnp.respondent.deviceId'

/**
 * A random id persisted in this browser, used only so a fully anonymous
 * respondent (no sign-in) can be recognised on a repeat visit for a form's
 * "one response per person" setting — the server never learns who they are,
 * just that this is the same browser as before. A soft, best-effort dedup, not
 * a hard guarantee: cleared by clearing site data, incognito, or a different
 * device/browser all read as "a new person". Returns `null` when storage isn't
 * available (private mode, etc.) — the caller just won't get deduped.
 */
export function getRespondentDeviceId(): string | null {
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY)
    if (existing) {
      return existing
    }
    const created = crypto.randomUUID()
    window.localStorage.setItem(STORAGE_KEY, created)
    return created
  } catch {
    return null
  }
}
