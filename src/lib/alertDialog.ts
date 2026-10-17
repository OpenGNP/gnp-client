/**
 * In-app replacements for window.alert / window.confirm, drawn by <AlertDialogHost />
 * (mounted once in main.tsx). Same call shape — `await showAlert(...)`,
 * `if (await showConfirm(...))` — so call sites read like before.
 */
export type AlertRequest = {
  kind: 'alert' | 'confirm'
  title: string
  message?: string
  confirmLabel: string
  /** Confirm only: red confirm button, for deleting and the like. */
  destructive: boolean
  resolve: (confirmed: boolean) => void
}

let queue: AlertRequest[] = []
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

function enqueue(request: Omit<AlertRequest, 'resolve'>): Promise<boolean> {
  return new Promise((resolve) => {
    queue = [...queue, { ...request, resolve }]
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
}: {
  title: string
  message?: string
  confirmLabel?: string
  destructive?: boolean
}): Promise<boolean> {
  return enqueue({ kind: 'confirm', title, message, confirmLabel, destructive })
}
