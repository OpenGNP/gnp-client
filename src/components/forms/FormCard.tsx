import { Clock3, FolderInput, FolderOpen, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { type ReactNode, useState } from 'react'

import { useInlineEdit } from '../../hooks/useInlineEdit'
import { cn } from '../../lib/utils'
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
  onRename?: (name: string) => void
  onMove?: () => void
}

function CardBody({
  image,
  imageAlt,
  titleSlot,
  updatedAt,
}: {
  image: string
  imageAlt: string
  titleSlot: ReactNode
  updatedAt: string
}) {
  return (
    <>
      <img
        src={image}
        alt={imageAlt}
        className="block h-[167px] w-full object-cover"
      />
      <div className="px-[11px] pt-[15px] pb-2.5">
        {titleSlot}
        <div className="flex items-center gap-[7px] pr-6 text-[9px] leading-3 font-normal tracking-[0.09px] text-[#969696] [&_svg]:shrink-0">
          <Clock3 className="shrink-0" size={18} />
          <span>Last update</span>
          <strong className="font-bold text-[#828282]">{updatedAt}</strong>
        </div>
      </div>
    </>
  )
}

function TitleRenameField({
  initialValue,
  onCommit,
  onCancel,
}: {
  initialValue: string
  onCommit: (name: string) => void
  onCancel: () => void
}) {
  const { inputProps } = useInlineEdit({ initialValue, onCommit, onCancel })

  return (
    <input
      aria-label="File name"
      className="m-0 mb-2.5 block w-full border-0 bg-transparent p-0 text-[12px] leading-4 font-bold tracking-[0.12px] text-black outline-0"
      {...inputProps}
    />
  )
}

export function FormCard({
  image,
  imageAlt = '',
  title,
  updatedAt,
  onOpen,
  onDelete,
  onRename,
  onMove,
}: FormCardProps) {
  const [isRenaming, setIsRenaming] = useState(false)

  return (
    <article
      className={cn(
        'relative h-[239px] w-full max-w-[235px] overflow-hidden rounded-lg bg-white shadow-[0_2px_7px_rgba(31,43,69,0.13)] max-[560px]:max-w-none',
        !isRenaming && 'transition-colors hover:bg-[#f7f8fb]',
      )}
    >
      {isRenaming && onRename ? (
        <CardBody
          image={image}
          imageAlt={imageAlt}
          titleSlot={
            <TitleRenameField
              initialValue={title}
              onCancel={() => setIsRenaming(false)}
              onCommit={(name) => {
                onRename(name)
                setIsRenaming(false)
              }}
            />
          }
          updatedAt={updatedAt}
        />
      ) : (
        <>
          <button
            className="block w-full cursor-pointer border-0 bg-transparent p-0 text-left"
            onClick={onOpen}
            type="button"
          >
            <CardBody
              image={image}
              imageAlt={imageAlt}
              titleSlot={
                <h3 className="m-0 mb-2.5 overflow-hidden text-ellipsis whitespace-nowrap text-[12px] leading-4 font-bold tracking-[0.12px] text-black">
                  {title}
                </h3>
              }
              updatedAt={updatedAt}
            />
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
              {onRename ? (
                <DropdownMenuItem onSelect={() => setIsRenaming(true)}>
                  <Pencil size={14} />
                  Rename
                </DropdownMenuItem>
              ) : null}
              {onMove ? (
                <DropdownMenuItem onSelect={onMove}>
                  <FolderInput size={14} />
                  Move
                </DropdownMenuItem>
              ) : null}
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
        </>
      )}
    </article>
  )
}
