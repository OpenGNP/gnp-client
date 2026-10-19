import { Clock3, FolderInput, FolderOpen, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { type DragEvent, type ReactNode, useState } from 'react'

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
  /** null = no date to show: the line is left blank (same height, so cards still line up). */
  updatedAt: string | null
  /** What `updatedAt` is, e.g. "Opened" when the list is sorted by Date opened. */
  timeLabel?: string
  imageAlt?: string
  /** A small label over the image, e.g. "Shared" for someone else's form. */
  badge?: string
  onOpen?: () => void
  onDelete?: () => void
  onRename?: (name: string) => void
  onMove?: () => void
  /** When set, the card is draggable and carries this id (drag-to-move on the Files page). */
  dragId?: string
  onDragStart?: (id: string) => void
  onDragEnd?: () => void
}

function CardBody({
  image,
  imageAlt,
  badge,
  titleSlot,
  updatedAt,
  timeLabel,
}: {
  image: string
  imageAlt: string
  badge?: string
  titleSlot: ReactNode
  updatedAt: string | null
  timeLabel: string
}) {
  return (
    <>
      <div className="relative">
        <img
          src={image}
          alt={imageAlt}
          className="block h-[167px] w-full object-cover"
        />
        {badge ? (
          <span className="absolute top-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-[#3f4045] shadow-sm">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="px-[11px] pt-[15px] pb-2.5">
        {titleSlot}
        {updatedAt ? (
          <div className="flex items-center gap-[7px] pr-6 text-[9px] leading-3 font-normal tracking-[0.09px] text-[#969696] [&_svg]:shrink-0">
            <Clock3 className="shrink-0" size={18} />
            <span>{timeLabel}</span>
            <strong className="font-bold text-[#828282]">{updatedAt}</strong>
          </div>
        ) : (
          <div aria-hidden="true" className="h-[18px]" />
        )}
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
  badge,
  timeLabel = 'Last update',
  title,
  updatedAt,
  onOpen,
  onDelete,
  onRename,
  onMove,
  dragId,
  onDragStart,
  onDragEnd,
}: FormCardProps) {
  const [isRenaming, setIsRenaming] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Draggable only when it has an id and isn't mid-rename (dragging would swallow
  // text selection in the rename field).
  const draggable = Boolean(dragId) && !isRenaming

  return (
    <article
      className={cn(
        'relative h-[239px] w-full max-w-[235px] overflow-hidden rounded-lg bg-white shadow-[0_2px_7px_rgba(31,43,69,0.13)] max-[560px]:max-w-none',
        !isRenaming && 'transition-colors hover:bg-[#f7f8fb]',
        draggable && 'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-40',
      )}
      draggable={draggable}
      onDragEnd={
        draggable
          ? () => {
              setIsDragging(false)
              onDragEnd?.()
            }
          : undefined
      }
      onDragStart={
        draggable
          ? (event: DragEvent<HTMLElement>) => {
              event.dataTransfer.setData('text/plain', dragId!)
              event.dataTransfer.effectAllowed = 'move'
              setIsDragging(true)
              onDragStart?.(dragId!)
            }
          : undefined
      }
    >
      {isRenaming && onRename ? (
        <CardBody
          badge={badge}
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
          timeLabel={timeLabel}
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
              badge={badge}
              image={image}
              imageAlt={imageAlt}
              titleSlot={
                <h3 className="m-0 mb-2.5 overflow-hidden text-ellipsis whitespace-nowrap text-[12px] leading-4 font-bold tracking-[0.12px] text-black">
                  {title}
                </h3>
              }
              timeLabel={timeLabel}
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
