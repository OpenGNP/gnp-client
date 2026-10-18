import { CircleAlert } from 'lucide-react'
import { useState, useSyncExternalStore } from 'react'

import { currentAlert, settleAlert, subscribeAlerts, type AlertRequest } from '../lib/alertDialog'
import { cn } from '../lib/utils'
import { MESSAGE_ACTION, MESSAGE_ACTION_STYLES, MESSAGE_DESCRIPTION, MESSAGE_TITLE } from './messageStyles'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog'

/** Draws showAlert / showConfirm requests, one at a time. Mounted once, at the app root. */
export function AlertDialogHost() {
  const request = useSyncExternalStore(subscribeAlerts, currentAlert)

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) settleAlert(false)
      }}
      open={request !== null}
    >
      {request ? (
        <DialogContent
          className="w-110 max-w-[calc(100vw-32px)] rounded-[10px] border border-[#e8eaf1] bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.18)]"
          role={request.kind === 'confirm' ? 'alertdialog' : 'dialog'}
        >
          <AlertBody key={request.id} request={request} />
        </DialogContent>
      ) : null}
    </Dialog>
  )
}

/** One request's contents; keyed by request, so typed confirmation text starts empty each time. */
function AlertBody({ request }: { request: AlertRequest }) {
  const [typed, setTyped] = useState('')
  const needsText = request.kind === 'confirm' && request.typeToConfirm !== undefined
  const canConfirm = !needsText || typed.trim() === request.typeToConfirm?.trim()

  return (
    <>
      <div className="flex items-start gap-3">
        {request.kind === 'alert' || request.destructive ? (
          <CircleAlert
            className={cn('mt-0.5 shrink-0', request.destructive ? 'text-destructive' : 'text-[#1e55c5]')}
            size={20}
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <DialogTitle className={MESSAGE_TITLE}>{request.title}</DialogTitle>
          {request.message ? (
            <DialogDescription className={cn(MESSAGE_DESCRIPTION, 'mt-1')}>{request.message}</DialogDescription>
          ) : (
            <DialogDescription className="sr-only">{request.title}</DialogDescription>
          )}
          {needsText ? (
            <label className="mt-4 block text-[13px] text-[#3f4045]">
              Type <strong className="font-semibold break-all">{request.typeToConfirm}</strong> to confirm
              <input
                autoComplete="off"
                autoFocus
                className="mt-1.5 h-9 w-full rounded-[6px] border border-[#d7dbe6] px-3 text-[13px] text-[#14181f] outline-none focus:border-destructive"
                onChange={(event) => setTyped(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && canConfirm) settleAlert(true)
                }}
                spellCheck={false}
                value={typed}
              />
            </label>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        {request.kind === 'confirm' ? (
          <button
            className={cn(MESSAGE_ACTION, MESSAGE_ACTION_STYLES.secondary)}
            onClick={() => settleAlert(false)}
            type="button"
          >
            Cancel
          </button>
        ) : null}
        <button
          // With text to type, focus goes to the input instead — Enter mustn't confirm by accident.
          autoFocus={!needsText}
          className={cn(
            MESSAGE_ACTION,
            MESSAGE_ACTION_STYLES[request.destructive ? 'destructive' : 'primary'],
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
          disabled={!canConfirm}
          onClick={() => settleAlert(true)}
          type="button"
        >
          {request.confirmLabel}
        </button>
      </div>
    </>
  )
}
