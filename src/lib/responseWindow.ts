import { formatRelativeTime } from './formatRelativeTime'

/**
 * A published form's response availability is the AND of three inputs — whether it's
 * published, the optional start/end window, and the manual "open for responses"
 * toggle. This collapses them into one state the UI can show as a single pill.
 *
 * Precedence: draft → closed → scheduled → paused → open. The window is a hard
 * boundary; the manual toggle only decides things *inside* it.
 */
export type ResponseState = 'draft' | 'scheduled' | 'open' | 'paused' | 'closed'

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
  if (!inputs.acceptingResponses) return 'paused'
  return 'open'
}

/**
 * Whether the "open for responses" toggle is what's actually deciding availability
 * right now. Outside the window (`scheduled`/`closed`) the schedule overrides it — the
 * toggle stays editable (it's the state the form takes once the window opens), the UI
 * just notes that it isn't in effect yet.
 */
export function isToggleEffective(state: ResponseState): boolean {
  return state === 'open' || state === 'paused'
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
  label: string
  detail: string
  tone: 'neutral' | 'positive' | 'warning' | 'danger'
}

export function describeResponseState(
  state: ResponseState,
  inputs: ResponseWindowInputs,
): ResponseStateBadge {
  switch (state) {
    case 'draft':
      return { label: 'Draft', detail: 'Not published yet', tone: 'neutral' }
    case 'scheduled':
      return {
        label: 'Scheduled',
        detail: inputs.startDate
          ? `Opens ${formatDateTime(inputs.startDate)} (${formatRelativeTime(inputs.startDate)})`
          : 'Opens later',
        tone: 'warning',
      }
    case 'closed':
      return {
        label: 'Closed',
        detail: inputs.endDate
          ? `Ended ${formatDateTime(inputs.endDate)} (${formatRelativeTime(inputs.endDate)})`
          : 'Response window ended',
        tone: 'danger',
      }
    case 'paused':
      return { label: 'Paused', detail: 'You stopped new responses', tone: 'warning' }
    case 'open':
    default:
      return {
        label: 'Open',
        detail: inputs.endDate
          ? `Accepting responses · closes ${formatDateTime(inputs.endDate)} (${formatRelativeTime(inputs.endDate)})`
          : 'Accepting responses',
        tone: 'positive',
      }
  }
}

/** Compact one-liner for the Publish popover's schedule summary — a plain range. */
export function scheduleSummary(inputs: Pick<ResponseWindowInputs, 'startDate' | 'endDate'>): string {
  const start = formatDateTime(inputs.startDate)
  const end = formatDateTime(inputs.endDate)
  if (start && end) return `Opens ${start} – ${end}`
  if (start) return `Opens ${start}`
  if (end) return `Opens immediately – ${end}`
  return 'Opens immediately'
}
