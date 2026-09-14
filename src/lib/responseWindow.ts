import { formatRelativeTime } from './formatRelativeTime'

/**
 * A published form's response availability is the AND of three inputs — whether it's
 * published, the optional start/end window, and the manual "open for responses"
 * toggle. This collapses them into one state the UI can show as a single pill.
 *
 * Precedence: draft → closed → scheduled → open. The window is a hard boundary; the
 * manual toggle only decides things *inside* it, and folds into 'closed' too — from
 * a respondent's perspective "not accepting responses" and "closed" look the same.
 */
export type ResponseState = 'draft' | 'scheduled' | 'open' | 'closed'

export type ResponseWindowInputs = {
  isPublished: boolean
  acceptingResponses: boolean
  startDate: string | null
  endDate: string | null
}

export function deriveResponseState(inputs: ResponseWindowInputs, now: number): ResponseState {
  if (!inputs.isPublished) return 'draft'
  if (inputs.endDate && now > Date.parse(inputs.endDate)) return 'closed'
  if (inputs.startDate && now < Date.parse(inputs.startDate)) return 'scheduled'
  if (!inputs.acceptingResponses) return 'closed'
  return 'open'
}

// Read once at import — no per-render environment reads (keeps the purity lint happy).
export const LOCAL_TIMEZONE: string = (() => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || ''
  } catch {
    return ''
  }
})()

const DATE_TIME_FORMAT: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' }

/** `new Date(iso)` with an argument is deterministic, so this is safe to call in render. */
export function formatDateTime(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString(undefined, DATE_TIME_FORMAT)
}

export type ResponseStateBadge = {
  /** The raw state, so the chip can pick a matching icon without a second lookup. */
  state: ResponseState
  label: string
  detail: string
  tone: 'neutral' | 'positive' | 'warning' | 'danger'
}

export function describeResponseState(
  state: ResponseState,
  inputs: ResponseWindowInputs,
  now: number,
): ResponseStateBadge {
  switch (state) {
    case 'draft':
      return { state, label: 'Draft', detail: 'Not published yet', tone: 'neutral' }
    case 'scheduled':
      return {
        state,
        label: 'Scheduled',
        detail: inputs.startDate
          ? `Opens ${formatDateTime(inputs.startDate)} (${formatRelativeTime(inputs.startDate)})`
          : 'Opens later',
        tone: 'warning',
      }
    case 'closed': {
      // Two different causes land here: the window actually ending, or the manual
      // "accepting responses" toggle being off (the form is otherwise still live).
      const windowEnded = Boolean(inputs.endDate) && now > Date.parse(inputs.endDate as string)
      return {
        state,
        label: 'Closed',
        detail: windowEnded
          ? `Ended ${formatDateTime(inputs.endDate)} (${formatRelativeTime(inputs.endDate)})`
          : 'Not accepting responses',
        tone: 'danger',
      }
    }
    case 'open':
    default:
      return {
        state,
        label: 'Open',
        detail: inputs.endDate
          ? `Accepting responses · closes ${formatDateTime(inputs.endDate)} (${formatRelativeTime(inputs.endDate)})`
          : 'Accepting responses',
        tone: 'positive',
      }
  }
}

/**
 * Badge for the raw `forms.status` lifecycle enum (`draft | active | closed |
 * archived`). For an `active` form it defers to the live response state (so a
 * scheduled or toggled-off active form reads correctly); the other statuses map
 * straight across. Same `ResponseStateBadge` shape / `ResponseStateChip` design used
 * in the form editor.
 */
export function formStatusBadge(
  status: string | null,
  window: Omit<ResponseWindowInputs, 'isPublished'>,
  now: number,
): ResponseStateBadge {
  if (status === 'archived') {
    return { state: 'closed', label: 'Archived', detail: 'This form has been archived', tone: 'neutral' }
  }
  if (status === 'closed') {
    return { state: 'closed', label: 'Closed', detail: 'This form has been closed', tone: 'danger' }
  }
  if (status !== 'active') {
    return { state: 'draft', label: 'Draft', detail: 'Not published yet', tone: 'neutral' }
  }
  const inputs: ResponseWindowInputs = { ...window, isPublished: true }
  return describeResponseState(deriveResponseState(inputs, now), inputs, now)
}

/** Compact one-liner describing the optional start/end window for the Publish popover. */
export function scheduleSummary(inputs: Pick<ResponseWindowInputs, 'startDate' | 'endDate'>): string {
  const start = formatDateTime(inputs.startDate)
  const end = formatDateTime(inputs.endDate)
  if (start && end) return `Opens ${start} – ${end}`
  if (start) return `Opens ${start}`
  if (end) return `Closes ${end}`
  return 'No start or end date'
}
