import { BarChart3, Tag, TrendingUp } from 'lucide-react'

export type DashboardView = 'themes' | 'trend' | 'response'

export type DashboardViewTabsProps = {
  activeView: DashboardView
  onSelectView: (view: DashboardView) => void
}

const dashboardViews: { value: DashboardView; label: string; icon: typeof Tag }[] = [
  { value: 'themes', label: 'Themes', icon: Tag },
  { value: 'trend', label: 'Trend', icon: TrendingUp },
  { value: 'response', label: 'Response', icon: BarChart3 },
]

export function DashboardViewTabs({ activeView, onSelectView }: DashboardViewTabsProps) {
  return (
    <div className="flex items-center gap-3.75" role="tablist" aria-label="Dashboard view">
      {dashboardViews.map((view) => {
        const Icon = view.icon
        const isActive = view.value === activeView
        const isAvailable = view.value === 'themes'

        return (
          <button
            className={
              isActive
                ? 'inline-flex h-9.25 shrink-0 cursor-pointer items-center gap-1.75 rounded-full bg-[#1e55c5] px-2.5 text-[14px] font-semibold text-white'
                : 'inline-flex h-9.25 shrink-0 items-center gap-1.75 rounded-full border border-[#717788] px-2.5 text-[14px] font-semibold text-[#726f6f] disabled:cursor-not-allowed disabled:opacity-60'
            }
            aria-selected={isActive}
            disabled={!isAvailable}
            key={view.value}
            onClick={() => onSelectView(view.value)}
            role="tab"
            title={isAvailable ? undefined : `${view.label} view coming soon`}
            type="button"
          >
            <Icon size={16} />
            {view.label}
          </button>
        )
      })}
    </div>
  )
}
