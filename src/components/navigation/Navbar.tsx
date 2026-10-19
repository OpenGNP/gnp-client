import { TopBar } from './TopBar'

export type NavbarProps = {
  title: string
  showSidebarToggle?: boolean
  onToggleSidebar?: () => void
}

/** Home / Files / Shared with me: just where you are (the sidebar navigates), so a title, not a tab. */
export function Navbar({ title, showSidebarToggle = false, onToggleSidebar }: NavbarProps) {
  return (
    <TopBar
      className="sticky top-0 z-20"
      onToggleSidebar={onToggleSidebar}
      showSidebarToggle={showSidebarToggle}
    >
      {/* Not an h1: each page has its own. */}
      <span>{title}</span>
    </TopBar>
  )
}
