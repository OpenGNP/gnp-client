import { CircleAlert } from 'lucide-react'
import { useSyncExternalStore } from 'react'

import { currentAlert, settleAlert, subscribeAlerts } from '../lib/alertDialog'
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
                <DialogDescription className={cn(MESSAGE_DESCRIPTION, 'mt-1')}>
                  {request.message}
                </DialogDescription>
              ) : (
                <DialogDescription className="sr-only">{request.title}</DialogDescription>
              )}
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
              autoFocus
              className={cn(MESSAGE_ACTION, MESSAGE_ACTION_STYLES[request.destructive ? 'destructive' : 'primary'])}
              onClick={() => settleAlert(true)}
              type="button"
            >
              {request.confirmLabel}
            </button>
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  )
}
