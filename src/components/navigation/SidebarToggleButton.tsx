import { Menu } from 'lucide-react'

import { Button } from '../ui/button'

export type SidebarToggleButtonProps = {
  onToggleSidebar?: () => void
}

export function SidebarToggleButton({ onToggleSidebar }: SidebarToggleButtonProps) {
  return (
    <Button
      // Desktop has the collapsed sidebar's icon rail (with its own expand button),
      // so this hamburger is only for narrow screens, where the sidebar fully hides.
      className="size-9 shrink-0 text-[#3f4045] min-[900px]:hidden"
      aria-label="Expand sidebar"
      onClick={onToggleSidebar}
      size="icon"
      variant="ghost"
    >
      <Menu className="size-6" strokeWidth={2.4} />
    </Button>
  )
}
