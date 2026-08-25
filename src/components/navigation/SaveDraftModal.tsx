import { ChevronRight, Folder } from 'lucide-react'
import { useState } from 'react'

import type { ProjectTreeItem } from '../../data/dashboard'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog'
import { findFolderById } from '../../utils/projectTree'

type BreadcrumbEntry = {
  id: string | null
  label: string
}

const ROOT_ENTRY: BreadcrumbEntry = { id: null, label: 'Your Project' }

export type SaveDraftModalProps = {
  open: boolean
  mode: 'save' | 'move'
  projects: ProjectTreeItem[]
  onOpenChange: (open: boolean) => void
  onConfirm: (folderId: string | null) => void
}

export function SaveDraftModal({
  open,
  mode,
  projects,
  onOpenChange,
  onConfirm,
}: SaveDraftModalProps) {
  const [path, setPath] = useState<BreadcrumbEntry[]>([ROOT_ENTRY])

  const currentEntry = path[path.length - 1]
  const currentFolder = currentEntry.id ? findFolderById(projects, currentEntry.id) : null
  const currentFolders = (currentFolder ? currentFolder.children : projects)?.filter(
    (project) => project.type === 'folder',
  ) ?? []

  const handleOpenFolder = (folder: ProjectTreeItem) => {
    setPath((previous) => [...previous, { id: folder.id, label: folder.label }])
  }

  const handleBreadcrumbClick = (index: number) => {
    setPath((previous) => previous.slice(0, index + 1))
  }

  const handleConfirm = () => {
    onConfirm(currentEntry.id)
    onOpenChange(false)
  }

  const actionLabel = mode === 'move' ? 'Move' : 'Save'

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="w-120 max-w-[calc(100vw-32px)] rounded-[10px] border border-[#d2d8e5] bg-white p-7 shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
        <DialogTitle className="m-0 text-[22px] font-normal text-[#3c4043]">
          {mode === 'move' ? 'Move form' : 'Save draft'}
        </DialogTitle>
        <DialogDescription className="mt-1 text-[13px] text-[#726f6f]">
          {mode === 'move'
            ? 'Choose a new location for this form.'
            : 'Choose a location for this form. You can move it later.'}
        </DialogDescription>

        <div className="mt-5 flex flex-wrap items-center gap-1 text-[14px]">
          {path.map((entry, index) => (
            <span className="flex items-center gap-1" key={entry.id ?? 'root'}>
              {index > 0 ? (
                <ChevronRight className="shrink-0 text-[#b0b1b3]" size={14} />
              ) : null}
              <button
                className={cn(
                  'cursor-pointer rounded px-1.5 py-1 hover:bg-[#f7f8fb] disabled:cursor-default disabled:hover:bg-transparent',
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

        <div className="mt-3 h-70 overflow-y-auto rounded-[8px] border border-[#e8eaf1] p-2">
          {currentFolders.length > 0 ? (
            currentFolders.map((folder) => (
              <button
                className="group flex h-12 w-full cursor-pointer items-center gap-2.5 rounded-[8px] px-3 text-left text-[14px] font-medium text-[#3f4045] hover:bg-[#f7f8fb]"
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
            ))
          ) : (
            <p className="m-0 flex h-full min-h-16 items-center justify-center px-3 text-center text-[13px] text-[#8b8e98]">
              No folders here
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <span className="min-w-0 truncate text-[13px] text-[#726f6f]">
            {mode === 'move' ? 'Move to' : 'Save to'}:{' '}
            <strong className="text-[#3f4045]">{currentEntry.label}</strong>
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <DialogClose asChild>
              <Button
                className="h-9.5 rounded-[5px] px-4 text-[14px] font-semibold tracking-[0.14px] text-[#726f6f]"
                variant="ghost"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              className="h-9.5 rounded-[5px] px-5 text-[14px] font-semibold tracking-[0.14px]"
              onClick={handleConfirm}
            >
              {actionLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
