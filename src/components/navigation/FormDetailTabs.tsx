import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { cn } from '../../lib/utils'
import { ShareControl } from '../dashboard/ShareDialog'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { TopBar } from './TopBar'

// Same highlight as the sidebar's current page, plus the tab underline.
const SELECTED_TAB = 'border-[#1e55c5] bg-[#edf2fd] text-[#1e55c5] hover:text-[#1e55c5]'

export type FormDetailTabsProps = {
  showSidebarToggle?: boolean
  onToggleSidebar?: () => void
  hasDashboardData?: boolean
  /** False for someone the form was only shared with to view: no editor. */
  canEdit?: boolean
}

export function FormDetailTabs({
  showSidebarToggle = false,
  onToggleSidebar,
  hasDashboardData = false,
  canEdit = true,
}: FormDetailTabsProps) {
  const { projectId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const isDashboardActive = location.pathname.endsWith('/dashboard')

  function handleValueChange(value: string) {
    if (value === 'dashboard') {
      if (hasDashboardData) {
        navigate(`/forms/${encodeURIComponent(projectId ?? '')}/dashboard`)
      }
      return
    }
    if (canEdit) navigate(`/forms/${encodeURIComponent(projectId ?? '')}`)
  }

  return (
    <TopBar
      actions={<ShareControl />}
      className="relative z-100"
      onToggleSidebar={onToggleSidebar}
      showSidebarToggle={showSidebarToggle}
    >
      <Tabs
        className="h-full"
        onValueChange={handleValueChange}
        value={isDashboardActive ? 'dashboard' : 'edit'}
      >
        <TabsList aria-label="Form detail" className="h-full">
          <TabsTrigger
            className={cn(
              'flex h-full w-32.25 cursor-pointer items-center justify-center border-0 border-b-2 bg-transparent text-[16px] tracking-[0.16px]',
              isDashboardActive
                ? 'border-transparent text-[#726f6f] hover:text-black'
                : SELECTED_TAB,
              !canEdit && 'cursor-not-allowed text-[#b0b1b3] hover:text-[#b0b1b3]',
            )}
            disabled={!canEdit}
            title={canEdit ? undefined : 'Shared with you to view only'}
            value="edit"
          >
            Edit form
          </TabsTrigger>
          <TabsTrigger
            className={cn(
              'flex h-full w-32.25 items-center justify-center border-0 border-b-2 bg-transparent text-[16px] tracking-[0.16px]',
              hasDashboardData
                ? 'cursor-pointer text-[#726f6f] hover:text-black'
                : 'cursor-not-allowed text-[#b0b1b3]',
              // Last, so the selected colours win over the ones above.
              isDashboardActive ? SELECTED_TAB : 'border-transparent',
            )}
            disabled={!hasDashboardData}
            title={hasDashboardData ? undefined : 'No dashboard data yet for this form'}
            value="dashboard"
          >
            Dashboard
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </TopBar>
  )
}
