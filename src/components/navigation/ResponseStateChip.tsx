import { CircleCheck, CircleSlash, Clock, PencilLine, type LucideIcon } from 'lucide-react'

import type { ResponseState, ResponseStateBadge } from '../../lib/responseWindow'
import { cn } from '../../lib/utils'

// Tinted pill matching the dashboard's status style (FormDashboardPage's StatusRow):
// rounded-full, h-8.5, text-[14px] font-semibold. A per-state icon leads the label.
const TONE: Record<ResponseStateBadge['tone'], string> = {
  neutral: 'bg-[#eef0f4] text-[#5f6368]',
  positive: 'bg-[#eaf9ec] text-[#08882c]',
  warning: 'bg-[#fff4e5] text-[#b7791f]',
  danger: 'bg-[#fcecef] text-[#c02b47]',
}

const ICON: Record<ResponseState, LucideIcon> = {
  draft: PencilLine,
  scheduled: Clock,
  open: CircleCheck,
  closed: CircleSlash,
}

export function ResponseStateChip({
  badge,
  className,
  iconOnly = false,
}: {
  badge: ResponseStateBadge
  className?: string
  /** Drop the text label — just the tinted icon. The label still lands in `aria-label` / the tooltip. */
  iconOnly?: boolean
}) {
  const Icon = ICON[badge.state]
  const tooltip = `${badge.label} — ${badge.detail}`

  if (iconOnly) {
    return (
      <span
        aria-label={badge.label}
        className={cn(
          'inline-flex size-8.5 shrink-0 items-center justify-center rounded-full',
          TONE[badge.tone],
          className,
        )}
        role="img"
        title={tooltip}
      >
        <Icon className="size-4 shrink-0" strokeWidth={2.4} aria-hidden="true" />
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex h-8.5 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[14px] font-semibold',
        TONE[badge.tone],
        className,
      )}
      title={badge.detail}
    >
      <Icon className="size-3.5 shrink-0" strokeWidth={2.4} aria-hidden="true" />
      {badge.label}
    </span>
  )
}
