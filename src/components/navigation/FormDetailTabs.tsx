import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { cn } from '../../lib/utils'
import { SidebarToggleButton } from './SidebarToggleButton'

export type FormDetailTabsProps = {
  showSidebarToggle?: boolean
  onToggleSidebar?: () => void
  hasDashboardData?: boolean
}

export function FormDetailTabs({
  showSidebarToggle = false,
  onToggleSidebar,
  hasDashboardData = false,
}: FormDetailTabsProps) {
  const { projectId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const isDashboardActive = location.pathname.endsWith('/dashboard')

  return (
    <div
      className="flex h-12.5 items-center gap-3 border-2 border-l-0 border-b-0 border-[#e8eaf1] bg-white px-10 font-['Inter_Variable'] max-[900px]:border-l-2 max-[560px]:px-4"
      role="tablist"
      aria-label="Form detail"
    >
      {showSidebarToggle ? (
        <SidebarToggleButton onToggleSidebar={onToggleSidebar} />
      ) : null}
      <button
        className={cn(
          'flex h-full w-32.25 cursor-pointer items-center justify-center border-0 border-b-2 bg-transparent text-[16px] tracking-[0.16px]',
          isDashboardActive
            ? 'border-transparent text-[#726f6f] hover:text-black'
            : 'border-[#4c71f7] text-black',
        )}
        aria-selected={!isDashboardActive}
        onClick={() => navigate(`/forms/${encodeURIComponent(projectId ?? '')}`)}
        role="tab"
        type="button"
      >
        Edit form
      </button>
      <button
        className={cn(
          'flex h-full w-32.25 items-center justify-center border-0 border-b-2 bg-transparent text-[16px] tracking-[0.16px]',
          isDashboardActive ? 'border-[#4c71f7] text-black' : 'border-transparent',
          hasDashboardData
            ? 'cursor-pointer text-[#726f6f] hover:text-black'
            : 'cursor-not-allowed text-[#b0b1b3]',
        )}
        aria-selected={isDashboardActive}
        disabled={!hasDashboardData}
        onClick={() => navigate(`/forms/${encodeURIComponent(projectId ?? '')}/dashboard`)}
        role="tab"
        title={hasDashboardData ? undefined : 'No dashboard data yet for this form'}
        type="button"
      >
        Dashboard
      </button>
    </div>
  )
}
