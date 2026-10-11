import { cn } from "../../lib/utils"

/** A pulsing placeholder block — size and shape it with `className`. Hidden from screen readers. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-[#e9edf4]", className)}
      {...props}
    />
  )
}

/**
 * Wraps a page's skeleton so assistive tech announces one "Loading …" status
 * instead of reading out empty placeholder boxes.
 */
function SkeletonRegion({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div aria-busy="true" aria-live="polite" className={className} role="status">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}

export { Skeleton, SkeletonRegion }
