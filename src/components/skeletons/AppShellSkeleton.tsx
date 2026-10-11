import { Skeleton, SkeletonRegion } from '../ui/skeleton'
import { FormCardGridSkeleton } from './FormCardSkeleton'
import { SidebarTreeSkeleton } from './SidebarTreeSkeleton'

/**
 * Shown by AppGate while the session resolves: the sidebar + Home layout in
 * placeholder form, so the real app fades in over the same shape.
 */
export function AppShellSkeleton() {
  return (
    <SkeletonRegion
      className="flex min-h-screen flex-col bg-[#f5f9ff] min-[900px]:flex-row"
      label="Connecting to the server…"
    >
      <div className="flex h-screen w-78.25 shrink-0 max-[1200px]:w-71.5 flex-col gap-4 border-r-2 border-[#e8eaf1] bg-white px-5 pt-6 max-[900px]:hidden">
        <Skeleton className="h-9.5 w-24" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-11.5 w-full rounded-[5px]" />
        <Skeleton className="h-10.5 w-full rounded-lg" />
        <SidebarTreeSkeleton />
      </div>
      <div className="flex-1 px-14 pt-16 max-[900px]:px-6">
        <Skeleton className="h-9 w-80 max-w-full" />
        <Skeleton className="mt-5 h-4.5 w-96 max-w-full" />
        <Skeleton className="mt-24 mb-6.5 h-4.5 w-32" />
        <FormCardGridSkeleton count={4} />
      </div>
    </SkeletonRegion>
  )
}
