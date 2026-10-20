import { Link } from 'react-router-dom'

import { TopBar } from './TopBar'

export type NavbarProps = {
  brand: { logo: string; name: string }
  showSidebarToggle?: boolean
  onToggleSidebar?: () => void
}

/**
 * Home / My forms / Shared with me, narrow screens only: the ☰ that opens the hidden sidebar,
 * and the logo the sidebar would otherwise show. Each page has its own heading.
 */
export function Navbar({ brand, showSidebarToggle = false, onToggleSidebar }: NavbarProps) {
  return (
    <TopBar
      className="sticky top-0 z-20 min-[900px]:hidden"
      onToggleSidebar={onToggleSidebar}
      showSidebarToggle={showSidebarToggle}
    >
      <Link aria-label={`${brand.name} home`} className="flex items-center" to="/">
        <img alt={brand.name} className="h-5 w-9.5 object-cover object-center" src={brand.logo} />
      </Link>
    </TopBar>
  )
}
