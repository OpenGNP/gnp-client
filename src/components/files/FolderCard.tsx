import { Folder, FolderOpen, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { useInlineEdit } from '../../hooks/useInlineEdit'
import type { ProjectTreeItem } from '../../data/dashboard'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

const cardBaseClass =
  'flex items-center gap-3 rounded-[10px] border border-[#e9eaed] bg-white px-4 py-3.5'

// Right-clicking a card must not open the Files page's "new file / folder" menu —
// that belongs to genuine white space only.
function stopContextMenu(event: { stopPropagation: () => void }) {
  event.stopPropagation()
}

// Inline folder-name field, shared by "new folder" and "rename".
function FolderNameInput({
  initialValue = '',
  onCommit,
  onCancel,
}: {
  initialValue?: string
  onCommit: (name: string) => void
  onCancel: () => void
}) {
  const { inputProps } = useInlineEdit({ initialValue, onCommit, onCancel })

  return (
    <input
      aria-label="Folder name"
      className="min-w-0 flex-1 border-0 bg-transparent text-[14px] font-medium text-[#3c4043] outline-0 placeholder:text-[#8a8d97]"
      placeholder="Folder name"
      {...inputProps}
    />
  )
}

export function FolderCard({
  folder,
  onOpen,
  onDelete,
  onRename,
}: {
  folder: ProjectTreeItem
  onOpen: () => void
  onDelete?: () => void
  onRename?: (name: string) => void
}) {
  const [isRenaming, setIsRenaming] = useState(false)

  if (isRenaming && onRename) {
    return (
      <div className={cardBaseClass} onContextMenu={stopContextMenu}>
        <Folder className="shrink-0 text-[#5f6368]" size={22} />
        <FolderNameInput
          initialValue={folder.label}
          onCancel={() => setIsRenaming(false)}
          onCommit={(name) => {
            onRename(name)
            setIsRenaming(false)
          }}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(cardBaseClass, 'relative transition-colors hover:bg-[#f7f8fb]')}
      onContextMenu={stopContextMenu}
    >
      <button
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 border-0 bg-transparent p-0 text-left"
        onClick={onOpen}
        type="button"
      >
        <Folder className="shrink-0 text-[#5f6368]" size={22} />
        <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-[#3c4043]">
          {folder.label}
        </span>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="size-5 shrink-0 rounded text-black hover:bg-black/5"
            aria-label={`More options for ${folder.label}`}
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
    </div>
  )
}

export function NewFolderCard({
  onCommit,
  onCancel,
}: {
  onCommit: (name: string) => void
  onCancel: () => void
}) {
  return (
    <div className={cardBaseClass} onContextMenu={stopContextMenu}>
      <FolderOpen className="shrink-0 text-[#1e55c5]" size={22} />
      <FolderNameInput onCancel={onCancel} onCommit={onCommit} />
    </div>
  )
}
