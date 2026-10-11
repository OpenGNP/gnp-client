import { Skeleton, SkeletonRegion } from '../ui/skeleton'

/**
 * Plain placeholder for a dashboard view's content (everything under the tabs +
 * title) until its data lands. Deliberately just rectangles, not a mock of the
 * cards — a form with no responses/themes shows an empty note instead, so faking
 * the cards would preview a layout that may never appear.
 */
export function ContentSkeleton({ label }: { label: string }) {
  return (
    <SkeletonRegion className="flex flex-col gap-5" label={label}>
      <Skeleton className="h-29.5 w-full rounded-[10px]" />
      <Skeleton className="h-80 w-full rounded-[10px]" />
    </SkeletonRegion>
  )
}
