import { Clock3, FolderOpen, MoreVertical, Trash2 } from 'lucide-react'

import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

export type FormCardProps = {
  title: string
  image: string
  updatedAt: string
  imageAlt?: string
  onOpen?: () => void
  onDelete?: () => void
}

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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="absolute right-2.25 bottom-2.25 size-5 rounded text-black hover:bg-black/5"
            aria-label={`More options for ${title}`}
            size="icon"
            variant="ghost"
          >
            <MoreVertical className="size-4.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={onOpen}>
            <FolderOpen size={14} />
            Open
          </DropdownMenuItem>
          {onDelete ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onDelete} variant="destructive">
                <Trash2 size={14} />
                Delete
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </article>
  )
}
