import { ChevronRight, Folder, FolderPlus, RefreshCw } from 'lucide-react'
import { useState } from 'react'

import type { ProjectTreeItem } from '../../data/dashboard'
import { cn } from '../../lib/utils'
import { useInlineEdit } from '../../hooks/useInlineEdit'
import { Button } from '../ui/button'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '../ui/context-menu'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog'
import { findFolderById } from '../../utils/projectTree'

type BreadcrumbEntry = {
  id: string | null
  label: string
}

const ROOT_ENTRY: BreadcrumbEntry = { id: null, label: 'My Project' }

export type SaveDraftModalMode = 'save' | 'publish' | 'move'

const modeCopy: Record<
  SaveDraftModalMode,
  { title: string; description: string; actionLabel: string; busyLabel: string; destinationLabel: string }
> = {
  save: {
    title: 'Save draft',
    description: 'Choose a location for this form. You can move it later.',
    actionLabel: 'Save',
    busyLabel: 'Saving…',
    destinationLabel: 'Save to',
  },
  publish: {
    title: 'Publish form',
    description: 'Choose a location to publish this form to. You can move it later.',
    actionLabel: 'Publish',
    busyLabel: 'Publishing…',
    destinationLabel: 'Publish to',
  },
  move: {
    title: 'Move form',
    description: 'Choose a new location for this form.',
    actionLabel: 'Move',
    busyLabel: 'Moving…',
    destinationLabel: 'Move to',
  },
}

export type SaveDraftModalProps = {
  open: boolean
  mode: SaveDraftModalMode
  projects: ProjectTreeItem[]
  onOpenChange: (open: boolean) => void
  /**
   * Given a promise, the dialog stays open — buttons disabled, a spinner on the action —
   * until it settles, and closes only if it didn't resolve `false` (a failure, already
   * reported), so the user can retry without picking the folder again.
   */
  onConfirm: (folderId: string | null) => void | Promise<boolean>
  /** 'move' mode only: whether the thing being moved is a form or a folder (drives the copy). */
  moveItemLabel?: 'form' | 'folder'
  /** 'move' mode only: hide this folder from the picker so it can't be moved into itself. */
  excludeFolderId?: string | null
  /** Enables right-click → "New folder" inside the folder being browsed. */
  onCreateFolder?: (name: string, parentFolderId: string | null) => void
}

function NewFolderRow({
  onCommit,
  onCancel,
}: {
  onCommit: (name: string) => void
  onCancel: () => void
}) {
  const { inputProps } = useInlineEdit({ initialValue: '', onCommit, onCancel })
  return (
    <div className="flex h-12 items-center gap-2.5 rounded-[8px] bg-[#f7f8fb] px-3">
      <Folder className="shrink-0 text-[#5f6368]" size={20} />
      <input
        aria-label="Folder name"
        className="min-w-0 flex-1 border-0 bg-transparent text-[14px] font-medium text-[#3f4045] outline-0 placeholder:text-[#8a8d97]"
        placeholder="Folder name"
        {...inputProps}
      />
    </div>
  )
}

export function SaveDraftModal({
  open,
  mode,
  projects,
  onOpenChange,
  onConfirm,
  moveItemLabel = 'form',
  excludeFolderId,
  onCreateFolder,
}: SaveDraftModalProps) {
  const [path, setPath] = useState<BreadcrumbEntry[]>([ROOT_ENTRY])
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [isBusy, setIsBusy] = useState(false)

  const currentEntry = path[path.length - 1]
  const currentFolder = currentEntry.id ? findFolderById(projects, currentEntry.id) : null
  const currentFolders = (currentFolder ? currentFolder.children : projects)?.filter(
    (project) => project.type === 'folder' && project.id !== excludeFolderId,
  ) ?? []

  const handleOpenFolder = (folder: ProjectTreeItem) => {
    setIsCreatingFolder(false)
    setPath((previous) => [...previous, { id: folder.id, label: folder.label }])
  }

  const handleBreadcrumbClick = (index: number) => {
    setIsCreatingFolder(false)
    setPath((previous) => previous.slice(0, index + 1))
  }

  const handleConfirm = async () => {
    const result = onConfirm(currentEntry.id)
    if (!result) {
      onOpenChange(false)
      return
    }
    setIsBusy(true)
    try {
      if (await result) onOpenChange(false)
    } finally {
      setIsBusy(false)
    }
  }

  const folderList = (
    <div
      className={cn('mt-3 h-70 overflow-y-auto rounded-[8px] border border-[#e8eaf1] p-2', isBusy && 'opacity-60')}
      inert={isBusy}
    >
      {currentFolders.length > 0 || isCreatingFolder ? (
        <>
          {isCreatingFolder && onCreateFolder ? (
            <NewFolderRow
              onCancel={() => setIsCreatingFolder(false)}
              onCommit={(name) => {
                onCreateFolder(name, currentEntry.id)
                setIsCreatingFolder(false)
              }}
            />
          ) : null}
          {currentFolders.map((folder) => (
            <button
              className="group flex h-12 w-full cursor-pointer items-center gap-2.5 rounded-[10px] px-3 text-left text-[14px] font-medium text-[#3f4045] hover:bg-[#f7f8fb] disabled:cursor-default disabled:opacity-60 disabled:hover:bg-transparent"
              // Still being created: it has no real id to save into yet.
              disabled={folder.pending}
              key={folder.id}
              onClick={() => handleOpenFolder(folder)}
              type="button"
            >
              <Folder className="shrink-0 text-[#5f6368]" size={20} />
              <span className="min-w-0 flex-1 truncate">{folder.label}</span>
              <ChevronRight
                className="shrink-0 text-[#b0b1b3] opacity-0 transition-opacity group-hover:opacity-100"
                size={18}
              />
            </button>
          ))}
        </>
      ) : (
        <p className="m-0 flex h-full min-h-16 items-center justify-center px-3 text-center text-[13px] text-[#8b8e98]">
          {onCreateFolder ? 'No folders here. Right-click to create one.' : 'No folders here'}
        </p>
      )}
    </div>
  )

  const copy =
    mode === 'move'
      ? {
          ...modeCopy.move,
          title: `Move ${moveItemLabel}`,
          description: `Choose a new location for this ${moveItemLabel}.`,
        }
      : modeCopy[mode]

  return (
    // Can't be dismissed mid-request: the result has nowhere else to show.
    <Dialog onOpenChange={(next) => (isBusy ? undefined : onOpenChange(next))} open={open}>
      <DialogContent
        aria-busy={isBusy || undefined}
        className="w-120 max-w-[calc(100vw-32px)] rounded-[10px] border border-[#d2d8e5] bg-white p-7 shadow-[0_16px_40px_rgba(15,23,42,0.18)]"
        // Escape while naming a new folder cancels the name, not the whole dialog.
        onEscapeKeyDown={(event) => {
          if (isCreatingFolder) event.preventDefault()
        }}
      >
        <DialogTitle className="m-0 text-[22px] font-normal text-[#3c4043]">
          {copy.title}
        </DialogTitle>
        <DialogDescription className="mt-1 text-[13px] text-[#726f6f]">
          {copy.description}
        </DialogDescription>

        <div className="mt-5 flex flex-wrap items-center gap-1 text-[14px]">
          {path.map((entry, index) => (
            <span className="flex items-center gap-1" key={entry.id ?? 'root'}>
              {index > 0 ? (
                <ChevronRight className="shrink-0 text-[#b0b1b3]" size={14} />
              ) : null}
              <button
                className={cn(
                  'cursor-pointer rounded-[10px] px-1.5 py-1 hover:bg-[#f7f8fb] disabled:cursor-default disabled:hover:bg-transparent',
                  index === path.length - 1
                    ? 'font-semibold text-[#3c4043]'
                    : 'text-[#1e55c5]',
                )}
                disabled={index === path.length - 1}
                onClick={() => handleBreadcrumbClick(index)}
                type="button"
              >
                {entry.label}
              </button>
            </span>
          ))}
        </div>

        {onCreateFolder ? (
          // Right-click inside the list → New folder, in the folder being browsed.
          <ContextMenu>
            <ContextMenuTrigger asChild>{folderList}</ContextMenuTrigger>
            {/* Don't hand focus back to the list on close — it would blur (and cancel) the new name field. */}
            <ContextMenuContent onCloseAutoFocus={(event) => event.preventDefault()}>
              <ContextMenuItem onSelect={() => setIsCreatingFolder(true)}>
                <FolderPlus size={16} />
                New folder
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ) : (
          folderList
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <span className="min-w-0 truncate text-[13px] text-[#726f6f]">
            {copy.destinationLabel}:{' '}
            <strong className="text-[#3f4045]">{currentEntry.label}</strong>
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <DialogClose asChild>
              <Button
                className="h-9.5 rounded-[10px] px-4 text-[14px] font-semibold tracking-[0.14px] text-[#726f6f]"
                disabled={isBusy}
                variant="ghost"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              className="h-9.5 rounded-[10px] px-5 text-[14px] font-semibold tracking-[0.14px]"
              disabled={isBusy}
              onClick={() => void handleConfirm()}
            >
              {isBusy ? <RefreshCw className="animate-spin" size={16} /> : null}
              {isBusy ? copy.busyLabel : copy.actionLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
