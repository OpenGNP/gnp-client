import { Circle } from "lucide-react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"

import { cn } from "../../lib/utils"

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("flex flex-col gap-5", className)}
      {...props}
    />
  )
}

function RadioGroupItem({
  className,
  dotSize = 10,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item> & {
  dotSize?: number
}) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "mt-0.75 inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-[#b0b1b3] bg-white text-primary outline-none data-[state=checked]:border-primary focus-visible:ring-2 focus-visible:ring-primary/30",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator>
        <Circle className="fill-current" size={dotSize} strokeWidth={0} />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}

export { RadioGroup, RadioGroupItem }
