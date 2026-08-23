import { SidebarToggleButton } from './SidebarToggleButton'

export type FormDetailTabsProps = {
  showSidebarToggle?: boolean
  onToggleSidebar?: () => void
}

export function FormDetailTabs({
  showSidebarToggle = false,
  onToggleSidebar,
}: FormDetailTabsProps) {
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
        className="flex h-full w-32.25 cursor-pointer items-center justify-center border-0 border-b-2 border-[#4c71f7] bg-transparent text-[16px] tracking-[0.16px] text-black"
        aria-selected="true"
        role="tab"
        type="button"
      >
        Edit form
      </button>
      <button
        className="flex h-full w-32.25 cursor-not-allowed items-center justify-center border-0 border-b-2 border-transparent bg-transparent text-[16px] tracking-[0.16px] text-[#b0b1b3]"
        aria-selected="false"
        disabled
        role="tab"
        title="Dashboard view coming soon"
        type="button"
      >
        Dashboard
      </button>
    </div>
  )
}
