import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import * as React from "react"
import { DayPicker, type DayButtonProps } from "react-day-picker"

import { cn } from "../../lib/utils"

function CalendarDayButton({ day, modifiers, className, ...props }: DayButtonProps) {
  const isRangeEdge = modifiers.range_start || modifiers.range_end
  const isSingleSelected = modifiers.selected && !modifiers.range_middle && !isRangeEdge
  const showPill = modifiers.range_middle || (isRangeEdge && !(modifiers.range_start && modifiers.range_end))

  return (
    <div className="relative flex h-9 w-full items-center justify-center" data-day={day.isoDate}>
      {showPill ? (
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-y-0.5 bg-[#edf2fd]",
            modifiers.range_start && "left-1/2 right-0",
            modifiers.range_end && "left-0 right-1/2",
            modifiers.range_middle && "inset-x-0",
          )}
        />
      ) : null}
      <button
        className={cn(
          "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-[12px] font-medium transition-colors",
          isRangeEdge || isSingleSelected
            ? "bg-[#1e55c5] text-white"
            : modifiers.range_middle
              ? "text-black hover:bg-white/70"
              : modifiers.outside
                ? "text-[#d1d1d1] hover:bg-transparent"
                : modifiers.disabled
                  ? "pointer-events-none text-[#d1d1d1]"
                  : "text-black hover:bg-[#f7f8fb]",
          modifiers.today && !isRangeEdge && !isSingleSelected && "border border-[#1e55c5]",
          className,
        )}
        {...props}
      />
    </div>
  )
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "dropdown-years",
  components,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      navLayout="around"
      captionLayout={captionLayout}
      className={cn("w-full", className)}
      classNames={{
        root: "w-full",
        months: "flex flex-col",
        month: "relative flex w-full flex-col gap-3",
        month_caption: "flex h-6 items-center justify-center",
        caption_label: "inline-flex items-center gap-0.5 text-[12px] font-medium text-black",
        dropdowns: "flex items-center gap-1 text-[12px] font-medium text-black",
        dropdown_root: "relative inline-flex items-center",
        dropdown: "absolute inset-0 z-10 cursor-pointer appearance-none opacity-0",
        button_previous:
          "absolute left-0 top-0 flex size-6 items-center justify-center rounded-[6px] text-[#3f4045] outline-none transition-colors hover:bg-[#f7f8fb] disabled:pointer-events-none disabled:opacity-40",
        button_next:
          "absolute right-0 top-0 flex size-6 items-center justify-center rounded-[6px] text-[#3f4045] outline-none transition-colors hover:bg-[#f7f8fb] disabled:pointer-events-none disabled:opacity-40",
        month_grid: "mt-1 w-full border-collapse",
        weekdays: "flex",
        weekday: "flex-1 pb-1.5 text-center text-[10px] font-medium text-[#929292]",
        week: "flex w-full",
        day: "flex-1 p-0 text-center align-middle",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClassName }) => {
          if (orientation === "left") {
            return <ChevronLeft className={chevronClassName} size={16} strokeWidth={1.8} />
          }
          if (orientation === "down") {
            return <ChevronDown className={chevronClassName} size={12} strokeWidth={2} />
          }
          return <ChevronRight className={chevronClassName} size={16} strokeWidth={1.8} />
        },
        DayButton: CalendarDayButton,
        ...components,
      }}
      {...props}
    />
  )
}

export { Calendar }
