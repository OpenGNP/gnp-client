import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { cn } from '../lib/utils'
import { MESSAGE_ACTION, MESSAGE_ACTION_STYLES, MESSAGE_DESCRIPTION, MESSAGE_TITLE } from './messageStyles'

type ErrorCardAction = {
  label: string
  /** A route to go to (rendered as a link)… */
  to?: string
  /** Router state for `to`. */
  state?: unknown
  /** …or something to do (rendered as a button). */
  onClick?: () => void
}

function ActionButton({
  action,
  variant,
}: {
  action: ErrorCardAction
  variant: 'primary' | 'secondary'
}) {
  // Full width and stacked: a whole-page state, not a dialog.
  const className = cn(MESSAGE_ACTION, 'w-full', MESSAGE_ACTION_STYLES[variant])
  return action.to ? (
    <Link className={className} state={action.state} to={action.to}>
      {action.label}
    </Link>
  ) : (
    <button className={className} onClick={action.onClick} type="button">
      {action.label}
    </button>
  )
}

/**
 * The app's one error card — a full-page "this didn't load" state (server unreachable,
 * no access, not found…). Title, a short explanation, then up to two stacked actions:
 * the way forward first, the way out second.
 */
export function ErrorCard({
  title,
  description,
  note,
  primaryAction,
  secondaryAction,
}: {
  title: string
  description?: ReactNode
  /** Small print under the description, e.g. which account is signed in. */
  note?: ReactNode
  primaryAction?: ErrorCardAction
  secondaryAction?: ErrorCardAction
}) {
  return (
    <div
      className="w-full max-w-[360px] rounded-[10px] border border-[#e8eaf1] bg-white p-8 text-center shadow-[0_16px_40px_rgba(15,23,42,0.10)]"
      role="alert"
    >
      <p className={cn(MESSAGE_TITLE, 'mb-1')}>{title}</p>
      {description ? <p className={MESSAGE_DESCRIPTION}>{description}</p> : null}
      {note ? <p className="m-0 mt-3 text-[12px] leading-4 text-[#726f6f]">{note}</p> : null}
      {primaryAction || secondaryAction ? (
        <div className="mt-5 flex flex-col gap-2">
          {primaryAction ? <ActionButton action={primaryAction} variant="primary" /> : null}
          {secondaryAction ? <ActionButton action={secondaryAction} variant="secondary" /> : null}
        </div>
      ) : null}
    </div>
  )
}
