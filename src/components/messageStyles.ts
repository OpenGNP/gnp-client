/**
 * Shared look for the app's two message surfaces — ErrorCard (a page that didn't load)
 * and AlertDialogHost (an action that failed / needs confirming) — so they read as one set.
 */
export const MESSAGE_TITLE = 'm-0 text-[15px] font-semibold text-[#3f4045]'
export const MESSAGE_DESCRIPTION = 'm-0 text-[13px] leading-5 wrap-break-word text-[#726f6f]'

export const MESSAGE_ACTION =
  'inline-flex h-9 cursor-pointer items-center justify-center rounded-[6px] px-4 text-[13px] font-semibold no-underline transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
export const MESSAGE_ACTION_STYLES = {
  primary: 'border-0 bg-[#1e55c5] text-white hover:bg-[#1a49aa]',
  secondary: 'border border-[#d7dbe6] bg-white text-[#3f4045] hover:bg-[#f7f8fb]',
  destructive: 'border-0 bg-destructive text-white hover:bg-destructive/90',
} as const
