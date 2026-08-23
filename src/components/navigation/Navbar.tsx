import { SidebarToggleButton } from './SidebarToggleButton'

export type NavbarProps = {
  title: string
  showSidebarToggle?: boolean
  onToggleSidebar?: () => void
}

export function Navbar({
  title,
  showSidebarToggle = false,
  onToggleSidebar,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-12.5 items-center gap-3 border-2 border-l-0 border-[#e8eaf1] bg-white px-10 text-[16px] font-normal tracking-[0.16px] text-black max-[900px]:border-l-2 max-[560px]:px-4">
      {showSidebarToggle ? (
        <SidebarToggleButton onToggleSidebar={onToggleSidebar} />
      ) : null}
      {title}
    </header>
  )
}
