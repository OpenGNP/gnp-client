import { Clock3, FolderOpen, MoreVertical, Trash2 } from 'lucide-react'
import { DropdownMenu } from 'radix-ui'

export type FormCardProps = {
  title: string
  image: string
  updatedAt: string
  imageAlt?: string
  onOpen?: () => void
  onDelete?: () => void
}

const menuItemClass =
  'flex cursor-pointer items-center gap-2 px-3 py-2 text-[13px] font-medium tracking-[0.13px] text-[#3f4045] outline-none data-highlighted:bg-[#f7f8fb]'

export function FormCard({
  image,
  imageAlt = '',
  title,
  updatedAt,
  onOpen,
  onDelete,
}: FormCardProps) {
  return (
    <article className="relative h-[239px] w-full max-w-[235px] overflow-hidden rounded-lg bg-white shadow-[0_2px_7px_rgba(31,43,69,0.13)] max-[560px]:max-w-none">
      <button
        className="block w-full cursor-pointer border-0 bg-transparent p-0 text-left"
        onClick={onOpen}
        type="button"
      >
        <img
          src={image}
          alt={imageAlt}
          className="block h-[167px] w-full object-cover"
        />
        <div className="px-[11px] pt-[15px] pb-2.5">
          <h3 className="m-0 mb-2.5 overflow-hidden text-ellipsis whitespace-nowrap text-[12px] leading-4 font-bold tracking-[0.12px] text-black">
            {title}
          </h3>
          <div className="flex items-center gap-[7px] pr-6 text-[9px] leading-3 font-normal tracking-[0.09px] text-[#969696] [&_svg]:shrink-0">
            <Clock3 className="shrink-0" size={18} />
            <span>Last update</span>
            <strong className="font-bold text-[#828282]">{updatedAt}</strong>
          </div>
        </div>
      </button>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className="absolute right-2.25 bottom-2.25 inline-flex size-5 cursor-pointer items-center justify-center rounded border-0 bg-transparent text-black hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-[#1e55c5]/40 focus-visible:outline-none"
            aria-label={`More options for ${title}`}
            type="button"
          >
            <MoreVertical size={18} />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            className="z-40 min-w-37.5 overflow-hidden rounded-[8px] border border-[#e8eaf1] bg-white py-1 shadow-[0_8px_24px_rgba(15,23,42,0.14)]"
            sideOffset={4}
          >
            <DropdownMenu.Item className={menuItemClass} onSelect={onOpen}>
              <FolderOpen size={14} />
              Open
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="my-1 h-px bg-[#e8eaf1]" />
            <DropdownMenu.Item
              className="flex cursor-pointer items-center gap-2 px-3 py-2 text-[13px] font-medium tracking-[0.13px] text-[#e0507a] outline-none data-highlighted:bg-[#fdeef2]"
              onSelect={onDelete}
            >
              <Trash2 size={14} />
              Delete
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </article>
  )
}
