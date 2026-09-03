import { ContextMenu as ContextMenuPrimitive } from "radix-ui"

import { cn } from "../../lib/utils"

const ContextMenu = ContextMenuPrimitive.Root
const ContextMenuTrigger = ContextMenuPrimitive.Trigger

function ContextMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Content>) {
  return (
    <ContextMenuPrimitive.Portal data-slot="context-menu-portal">
      <ContextMenuPrimitive.Content
        data-slot="context-menu-content"
        className={cn(
          "z-110 min-w-37.5 overflow-hidden rounded-[8px] border border-[#e8eaf1] bg-white py-1 shadow-[0_8px_24px_rgba(15,23,42,0.14)] data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          className,
        )}
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  )
}

function ContextMenuItem({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Item> & {
  variant?: "default" | "destructive"
}) {
  return (
    <ContextMenuPrimitive.Item
      data-slot="context-menu-item"
      data-variant={variant}
      className={cn(
        "flex cursor-pointer items-center gap-2 px-3 py-2 text-[13px] font-medium tracking-[0.13px] outline-none",
        variant === "destructive"
          ? "text-destructive data-highlighted:bg-[#fdeef2]"
          : "text-[#3f4045] data-highlighted:bg-muted",
        className,
      )}
      {...props}
    />
  )
}

function ContextMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Separator>) {
  return (
    <ContextMenuPrimitive.Separator
      data-slot="context-menu-separator"
      className={cn("my-1 h-px bg-[#e8eaf1]", className)}
      {...props}
    />
  )
}

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
}
