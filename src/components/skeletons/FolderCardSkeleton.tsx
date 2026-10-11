import { Skeleton } from '../ui/skeleton'

/** A grid of folder-card placeholders, laid out like FilesPage's folder grid. */
export function FolderCardGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
      {Array.from({ length: count }, (_, index) => (
        <div
          className="flex items-center gap-3 rounded-[10px] border border-[#e9eaed] bg-white px-4 py-3.5"
          key={index}
        >
          <Skeleton className="size-5.5 shrink-0 rounded-[4px]" />
          <Skeleton className="h-3.5 flex-1" />
        </div>
      ))}
    </div>
  )
}
