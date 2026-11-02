import { BarChart3, Tag, TrendingUp, UserRound } from 'lucide-react'

import { cn } from '../../lib/utils'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'

export type DashboardView = 'themes' | 'trend' | 'response' | 'individual'

/** The view's content area; the tabs point at it (`aria-controls`). */
export const DASHBOARD_VIEW_PANEL_ID = 'dashboard-view-panel'

export type DashboardViewTabsProps = {
  activeView: DashboardView
  onSelectView: (view: DashboardView) => void
}

const dashboardViews: { value: DashboardView; label: string; icon: typeof Tag }[] = [
  { value: 'themes', label: 'Themes', icon: Tag },
  { value: 'trend', label: 'Trend', icon: TrendingUp },
  { value: 'response', label: 'Response', icon: BarChart3 },
  { value: 'individual', label: 'Individual', icon: UserRound },
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

          return (
            <TabsTrigger
              aria-controls={DASHBOARD_VIEW_PANEL_ID}
              className={cn(
                'inline-flex h-9.25 shrink-0 cursor-pointer items-center gap-1.75 rounded-full px-2.5 text-[14px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2',
                isActive ? 'bg-[#1e55c5] text-white' : 'border border-[#717788] text-[#726f6f]',
              )}
              key={view.value}
              value={view.value}
            >
              <Icon aria-hidden size={16} />
              {view.label}
            </TabsTrigger>
          )
        })}
      </TabsList>
    </Tabs>
  )
}
