import { Menu } from 'lucide-react'

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
        <button
          className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-[#3f4045] transition-colors hover:bg-[#f7f8fb] focus-visible:ring-2 focus-visible:ring-[#1e55c5]/40 focus-visible:outline-none"
          aria-label="Expand sidebar"
          onClick={onToggleSidebar}
          type="button"
        >
          <Menu size={24} strokeWidth={2.4} />
        </button>
      ) : null}
      {title}
    </header>
  )
}
