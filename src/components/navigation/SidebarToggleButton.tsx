import { Menu } from 'lucide-react'

import { Button } from '../ui/button'

export type SidebarToggleButtonProps = {
  onToggleSidebar?: () => void
}

export function SidebarToggleButton({ onToggleSidebar }: SidebarToggleButtonProps) {
  return (
    <Button
      className="size-9 shrink-0 text-[#3f4045]"
      aria-label="Expand sidebar"
      onClick={onToggleSidebar}
      size="icon"
      variant="ghost"
    >
      <Menu className="size-6" strokeWidth={2.4} />
    </Button>
  )
}
