import { Menu } from 'lucide-react'

export type SidebarToggleButtonProps = {
  onToggleSidebar?: () => void
}

export function SidebarToggleButton({ onToggleSidebar }: SidebarToggleButtonProps) {
  return (
    <button
      className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-[#3f4045] transition-colors hover:bg-[#f7f8fb] focus-visible:ring-2 focus-visible:ring-[#1e55c5]/40 focus-visible:outline-none"
      aria-label="Expand sidebar"
      onClick={onToggleSidebar}
      type="button"
    >
      <Menu size={24} strokeWidth={2.4} />
    </button>
  )
}
