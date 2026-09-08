import type { ResponseStateBadge } from '../../lib/responseWindow'
import { cn } from '../../lib/utils'

// Same shape as the status pill on the dashboard (FormDashboardPage's StatusRow):
// rounded-full tinted pill, h-8.5, gap-1.25, text-[14px] font-semibold, leading dot
// in the text colour.
const TONE: Record<ResponseStateBadge['tone'], string> = {
  neutral: 'bg-[#eef0f4] text-[#5f6368]',
  positive: 'bg-[#eaf9ec] text-[#08882c]',
  warning: 'bg-[#fff4e5] text-[#b7791f]',
  danger: 'bg-[#fcecef] text-[#c02b47]',
}

export function ResponseStateChip({
  badge,
  className,
}: {
  badge: ResponseStateBadge
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex h-8.5 shrink-0 items-center gap-1.25 rounded-full px-2 text-[14px] font-semibold',
        TONE[badge.tone],
        className,
      )}
      title={badge.detail}
    >
      <span className="size-2.75 shrink-0 rounded-full bg-current" aria-hidden="true" />
      {badge.label}
    </span>
  )
}
