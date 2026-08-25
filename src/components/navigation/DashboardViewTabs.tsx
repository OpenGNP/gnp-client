import { BarChart3, Tag, TrendingUp } from 'lucide-react'

import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'

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
    <Tabs
      onValueChange={(value) => onSelectView(value as DashboardView)}
      value={activeView}
    >
      <TabsList className="gap-3.75" aria-label="Dashboard view">
        {dashboardViews.map((view) => {
          const Icon = view.icon
          const isActive = view.value === activeView
          const isAvailable = view.value === 'themes' || view.value === 'response'

          return (
            <TabsTrigger
              className={
                isActive
                  ? 'inline-flex h-9.25 shrink-0 cursor-pointer items-center gap-1.75 rounded-full bg-[#1e55c5] px-2.5 text-[14px] font-semibold text-white'
                  : 'inline-flex h-9.25 shrink-0 items-center gap-1.75 rounded-full border border-[#717788] px-2.5 text-[14px] font-semibold text-[#726f6f] disabled:cursor-not-allowed disabled:opacity-60'
              }
              disabled={!isAvailable}
              key={view.value}
              title={isAvailable ? undefined : `${view.label} view coming soon`}
              value={view.value}
            >
              <Icon size={16} />
              {view.label}
            </TabsTrigger>
          )
        })}
      </TabsList>
    </Tabs>
  )
}
