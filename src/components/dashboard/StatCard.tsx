import { ArrowUp } from 'lucide-react'

import { cn } from '../../lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'

/** A dashboard summary card: icon, label, big number, and a delta or footer line. Needs an `@container` parent. */
export function StatCard({
  icon,
  iconBgClassName,
  label,
  value,
  deltaLabel,
  deltaClassName,
  onClick,
  note,
  noteTooltip,
  footer,
}: {
  icon: React.ReactNode
  iconBgClassName: string
  label: string
  value: number | string
  /** Omit to hide the delta line entirely. */
  deltaLabel?: string
  deltaClassName: string
  /** Makes the whole card a button (e.g. jump to the list behind the number). */
  onClick?: () => void
  /** A grey aside beside the big number. */
  note?: string
  /** Explains `note` on hover. */
  noteTooltip?: string
  /** Shown on the line under the number when there's no delta (e.g. the owner's "5 to review"). */
  footer?: React.ReactNode
}) {
  const Root = onClick ? 'button' : 'div'
  return (
    <Root
      className={cn(
        'flex h-29.5 min-w-0 flex-col gap-2 rounded-[10px] border border-[#e9eaed] bg-white px-3.75 pt-4 text-left',
        onClick && 'focus-visible:outline-2 focus-visible:outline-offset-2',
        onClick && 'cursor-pointer transition-colors hover:border-[#d2d8e5] hover:bg-[#fbfcfe]',
      )}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      <p className="m-0 flex w-full min-w-0 items-center gap-1.5 text-[12px] font-medium text-[#726f6f]">
        {/* The icon moves up here, small, while three cards share a narrow row. */}
        <span aria-hidden="true" className="hidden shrink-0 @min-[34rem]:@max-[50rem]:flex [&_svg]:size-3.5">
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </p>
      <div className="flex min-w-0 items-center gap-4.5 @min-[34rem]:@max-[50rem]:gap-2.5">
        <div
          aria-hidden="true"
          // Moved next to the label (above) while three cards share a narrow row.
          className={`flex size-15.25 shrink-0 items-center justify-center rounded-[6px] @min-[34rem]:@max-[50rem]:hidden ${iconBgClassName}`}
        >
          {icon}
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="m-0 flex min-w-0 items-baseline gap-2">
            <span className="text-[20px] font-bold text-[#14181f]">{value}</span>
            {/* Dotted underline only when there's something to read on hover. */}
            {note && noteTooltip ? (
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <span
                    className="cursor-help truncate rounded-[4px] text-[12px] font-medium text-[#726f6f] underline decoration-dotted underline-offset-2"
                    // Focusable (when the card isn't itself a button) so keyboard users get the explanation too.
                    tabIndex={onClick ? undefined : 0}
                  >
                    {note}
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-64 whitespace-normal leading-4.5" side="top">
                  {noteTooltip}
                </TooltipContent>
              </Tooltip>
            ) : note ? (
              <span className="truncate text-[12px] font-medium text-[#726f6f]">{note}</span>
            ) : null}
          </p>
          {/* Always one line tall, even when empty or wrapping: a second line spills into
              the card's bottom padding, so the big number never moves (and lines up across cards). */}
          <div
            className={`flex h-4 min-w-0 items-start gap-0.5 text-[12px] leading-4 font-medium ${deltaClassName}`}
          >
            {deltaLabel ? (
              <>
                <ArrowUp className="shrink-0" size={15} />
                <span className="truncate" title={deltaLabel}>
                  {deltaLabel}
                </span>
              </>
            ) : (
              footer
            )}
          </div>
        </div>
      </div>
    </Root>
  )
}
