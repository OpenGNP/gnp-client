import { Skeleton } from '../ui/skeleton'

/** Same footprint as `FormCard` (235×239, 167px cover). */
export function FormCardSkeleton() {
  return (
    <div className="h-[239px] w-full max-w-[235px] overflow-hidden rounded-lg bg-white shadow-[0_2px_7px_rgba(31,43,69,0.13)] max-[560px]:max-w-none">
      <Skeleton className="h-[167px] w-full rounded-none" />
      <div className="flex flex-col gap-3 px-[11px] pt-[15px] pb-2.5">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

/** A grid of form-card placeholders, laid out like HomePage / FilesPage's card grid. */
export function FormCardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(235px,100%),235px))] gap-x-8 gap-y-5.25 max-[560px]:grid-cols-1">
      {Array.from({ length: count }, (_, index) => (
        <FormCardSkeleton key={index} />
      ))}
    </div>
  )
}
