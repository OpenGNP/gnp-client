import { Skeleton, SkeletonRegion } from '../ui/skeleton'

/** Fills the respondent page's white card: cover, title, description, questions, submit. */
export function PublicFormSkeleton() {
  return (
    <SkeletonRegion label="Loading form…">
      <Skeleton className="h-36 w-full rounded-none" />
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-2.5">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>
        {[0, 1, 2].map((index) => (
          <div className="flex flex-col gap-3" key={index}>
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
        <Skeleton className="h-11 w-full rounded-full" />
      </div>
    </SkeletonRegion>
  )
}
