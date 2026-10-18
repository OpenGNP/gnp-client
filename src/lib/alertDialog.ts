/**
 * In-app replacements for window.alert / window.confirm, drawn by <AlertDialogHost />
 * (mounted once in main.tsx). Same call shape — `await showAlert(...)`,
 * `if (await showConfirm(...))` — so call sites read like before.
 */
export type AlertRequest = {
  id: number
  kind: 'alert' | 'confirm'
  title: string
  message?: string
  confirmLabel: string
  /** Confirm only: red confirm button, for deleting and the like. */
  destructive: boolean
  /** Confirm only: must be typed exactly before the confirm button enables. */
  typeToConfirm?: string
  resolve: (confirmed: boolean) => void
}

let queue: AlertRequest[] = []
let nextId = 1
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())

export function subscribeAlerts(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** The dialog on screen; the rest wait their turn. */
export const currentAlert = () => queue[0] ?? null

export function settleAlert(confirmed: boolean) {
  const [current, ...rest] = queue
  if (!current) return
  queue = rest
  emit()
  current.resolve(confirmed)
}

function enqueue(request: Omit<AlertRequest, 'id' | 'resolve'>): Promise<boolean> {
  return new Promise((resolve) => {
    queue = [...queue, { ...request, id: nextId++, resolve }]
    emit()
  })
}

/** Something went wrong / heads-up. Resolves once dismissed. */
export async function showAlert(message: string, { title = 'Something went wrong' }: { title?: string } = {}) {
  await enqueue({ kind: 'alert', title, message, confirmLabel: 'OK', destructive: false })
}

/** Resolves true on confirm, false on cancel / Escape / clicking outside. */
export function showConfirm({
  title,
  message,
  confirmLabel = 'Confirm',
  destructive = false,
  typeToConfirm,
}: {
  title: string
  message?: string
  confirmLabel?: string
  destructive?: boolean
  /** For what can't be undone and costs a lot (e.g. collected responses). */
  typeToConfirm?: string
}): Promise<boolean> {
  return enqueue({ kind: 'confirm', title, message, confirmLabel, destructive, typeToConfirm })
}
