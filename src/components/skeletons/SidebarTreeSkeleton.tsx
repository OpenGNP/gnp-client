import { Skeleton } from '../ui/skeleton'

// Varied widths so it reads as a list of names rather than a striped block.
const ROW_WIDTHS = ['w-3/5', 'w-4/5', 'w-1/2', 'w-2/3', 'w-3/4']

/** Placeholder rows for the sidebar's project tree, at the tree's 46px row height. */
export function SidebarTreeSkeleton() {
  return (
    <div className="flex flex-col">
      {ROW_WIDTHS.map((width, index) => (
        <div className="flex h-[46px] items-center gap-2.5 p-2.5" key={index}>
          <Skeleton className="size-5 shrink-0 rounded-[4px]" />
          <Skeleton className={`h-4 ${width}`} />
        </div>
      ))}
    </div>
  )
}
