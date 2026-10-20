import { FORM_COVER_CLASS, FORM_DIVIDER_CLASS, FormPaper } from '../forms/FormPaper'
import { Skeleton, SkeletonRegion } from '../ui/skeleton'

/** The respondent page while loading: the same FormPaper and cover as the loaded form. */
export function PublicFormSkeleton() {
  return (
    <FormPaper>
      <SkeletonRegion label="Loading form…">
        <div className="flex w-full flex-col gap-5">
          <Skeleton className={`${FORM_COVER_CLASS} rounded-none`} />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className={FORM_DIVIDER_CLASS} />
          <Skeleton className="h-8 w-48" />
          {[0, 1, 2].map((index) => (
            <div className="flex flex-col gap-3" key={index}>
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
          <Skeleton className="h-11 w-full rounded-full sm:w-36" />
        </div>
      </SkeletonRegion>
    </FormPaper>
  )
}
