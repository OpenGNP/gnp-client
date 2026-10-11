import { Skeleton, SkeletonRegion } from '../ui/skeleton'

function QuestionSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-[10px] border border-[#e8eaf1] p-6">
      <Skeleton className="h-4.5 w-2/3" />
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="size-5 shrink-0 rounded-full" />
          <Skeleton className="h-3.5 w-1/3" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="size-5 shrink-0 rounded-full" />
          <Skeleton className="h-3.5 w-1/4" />
        </div>
      </div>
    </div>
  )
}

/** Mirrors `CreateFormCard`: cover, title + description, then a couple of question blocks. */
export function FormEditorSkeleton() {
  return (
    <SkeletonRegion className="mx-auto w-full max-w-[978px]" label="Loading this form…">
      <div className="min-h-[657px] w-full overflow-hidden rounded-[10px] bg-white pt-15.25 pr-17.5 pb-28.75 pl-20 max-[760px]:min-h-[560px] max-[760px]:px-6 max-[760px]:pt-9 max-[760px]:pb-12">
        <div className="flex flex-col gap-5">
          <Skeleton className="h-45 w-full rounded-[10px]" />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
          <div className="h-px w-full bg-[#e8eaf1]" />
          <Skeleton className="h-6 w-40" />
          <QuestionSkeleton />
          <QuestionSkeleton />
        </div>
      </div>
    </SkeletonRegion>
  )
}
