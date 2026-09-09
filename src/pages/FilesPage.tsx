import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronRight,
  FilePlus,
  FolderPlus,
} from 'lucide-react'
import { type DragEvent, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { FolderCard, NewFolderCard } from '../components/files/FolderCard'
import { FormCard } from '../components/forms/FormCard'
import { PageContainer } from '../components/layout/PageContainer'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '../components/ui/context-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import type { ProjectTreeItem } from '../data/dashboard'
import { formatRelativeTime } from '../lib/formatRelativeTime'
import { placeholderFormImage } from '../lib/formCardImage'
import { cn } from '../lib/utils'
import { getFolderPath } from '../utils/projectTree'

export type FilesPageProps = {
  projects: ProjectTreeItem[]
  onCreateFolder: (name: string, parentFolderId: string | null) => void
  onCreateForm: (parentFolderId: string | null) => void
  onDeleteItem: (id: string) => void
  onMoveItem: (id: string) => void
  /** Direct move (drag-and-drop): put `id` into `folderId` (null = root). */
  onMoveItemInto: (id: string, folderId: string | null) => void
  onRenameItem: (id: string, label: string) => void
}

const ROOT_CRUMB = '__root__'

type SortKey = 'name' | 'modified' | 'created'
type SortDir = 'asc' | 'desc'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'modified', label: 'Date modified' },
  { key: 'created', label: 'Date created' },
]

// Sensible default direction when the sort key is switched (A→Z for names,
// newest-first for dates); the user can still flip it with the toggle.
const DEFAULT_DIR: Record<SortKey, SortDir> = { name: 'asc', modified: 'desc', created: 'desc' }

const compareByName = (a: ProjectTreeItem, b: ProjectTreeItem) =>
  a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' })

// `Date.parse(string)` is deterministic, so this is render-safe. Missing/unparseable → 0.
const timeOf = (item: ProjectTreeItem, key: SortKey) =>
  Date.parse((key === 'created' ? item.createdAt : item.updatedAt) ?? '') || 0

function sortItems(list: ProjectTreeItem[], sortKey: SortKey, sortDir: SortDir): ProjectTreeItem[] {
  const flip = sortDir === 'asc' ? 1 : -1
  const compare =
    sortKey === 'name'
      ? (a: ProjectTreeItem, b: ProjectTreeItem) => flip * compareByName(a, b)
      : (a: ProjectTreeItem, b: ProjectTreeItem) =>
          flip * (timeOf(a, sortKey) - timeOf(b, sortKey)) || compareByName(a, b)
  return [...list].sort(compare)
}

// A right-click on a card should fall through to the browser, not open the page's
// "new file / new folder" menu — that belongs to genuine white space only.
function stopContextMenu(event: { stopPropagation: () => void }) {
  event.stopPropagation()
}

export function FilesPage({
  projects,
  onCreateFolder,
  onCreateForm,
  onDeleteItem,
  onMoveItem,
  onMoveItemInto,
  onRenameItem,
}: FilesPageProps) {
  const navigate = useNavigate()
  const { folderId } = useParams()
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  function chooseSort(key: SortKey) {
    setSortKey(key)
    setSortDir(DEFAULT_DIR[key])
  }
  // Id of the card being dragged right now (null when nothing is), plus which
  // breadcrumb crumb the cursor is over — both just drive the drop highlighting.
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverCrumb, setDragOverCrumb] = useState<string | null>(null)

  const path = folderId ? getFolderPath(projects, folderId) : []
  const currentFolder = path.length > 0 ? path[path.length - 1] : null
  const currentFolderId = currentFolder?.id ?? null
  // Inside a resolved folder we always show ITS contents (empty when it has no
  // children); only the true root falls back to the top-level project list.
  const items = currentFolder ? (currentFolder.children ?? []) : projects

  const folders = sortItems(
    items.filter((item) => item.type === 'folder'),
    sortKey,
    sortDir,
  )
  const files = sortItems(
    items.filter((item) => item.type === 'document'),
    sortKey,
    sortDir,
  )
  const activeSortLabel = SORT_OPTIONS.find((option) => option.key === sortKey)?.label ?? 'Name'

  function openFolder(id: string) {
    navigate(`/files/${encodeURIComponent(id)}`)
  }

  function openForm(id: string) {
    navigate(`/forms/${encodeURIComponent(id)}`)
  }

  function deleteItem(item: ProjectTreeItem) {
    if (window.confirm(`Delete "${item.label}"? This can't be undone.`)) {
      onDeleteItem(item.id)
    }
  }

  function endDrag() {
    setDraggingId(null)
    setDragOverCrumb(null)
  }

  // Drop handlers for a breadcrumb crumb (an ancestor folder, or `null` for root).
  // `key` is what `dragOverCrumb` stores, so a crumb only lights up while hovered.
  function crumbDropProps(targetFolderId: string | null) {
    if (draggingId === null) return {}
    const key = targetFolderId ?? ROOT_CRUMB

    return {
      'data-drop-over': dragOverCrumb === key || undefined,
      onDragOver: (event: DragEvent<HTMLElement>) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
        if (dragOverCrumb !== key) setDragOverCrumb(key)
      },
      onDragLeave: (event: DragEvent<HTMLElement>) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
        setDragOverCrumb((current) => (current === key ? null : current))
      },
      onDrop: (event: DragEvent<HTMLElement>) => {
        event.preventDefault()
        const id = event.dataTransfer.getData('text/plain')
        endDrag()
        if (id) onMoveItemInto(id, targetFolderId)
      },
    }
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="min-h-[calc(100vh-50px)]">
          <PageContainer>
            <nav
              aria-label="Breadcrumb"
              className="flex flex-wrap items-center gap-0.5 pt-8 pb-1 text-[22px] text-[#3c4043]"
            >
              <button
                className="cursor-pointer rounded px-1.5 py-1 font-medium hover:bg-[#f7f8fb] disabled:cursor-default disabled:font-semibold disabled:hover:bg-transparent data-drop-over:bg-[#dbe7ff] data-drop-over:text-[#1e55c5]"
                disabled={path.length === 0}
                onClick={() => navigate('/files')}
                type="button"
                {...crumbDropProps(null)}
              >
                My Project
              </button>
              {path.map((folder, index) => {
                const isLast = index === path.length - 1

                return (
                  <span className="flex items-center gap-0.5" key={folder.id}>
                    <ChevronRight className="shrink-0 text-[#b0b1b3]" size={18} />
                    <button
                      className={cn(
                        'cursor-pointer rounded px-1.5 py-1 hover:bg-[#f7f8fb] disabled:cursor-default disabled:hover:bg-transparent data-drop-over:bg-[#dbe7ff] data-drop-over:text-[#1e55c5]',
                        isLast ? 'font-semibold' : 'text-[#1e55c5]',
                      )}
                      disabled={isLast}
                      onClick={() => openFolder(folder.id)}
                      type="button"
                      {...(isLast ? {} : crumbDropProps(folder.id))}
                    >
                      {folder.label}
                    </button>
                  </span>
                )
              })}
            </nav>

            <div className="mt-4 flex justify-end gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-[6px] border border-[#e0e2e7] bg-white px-3 py-1.5 text-[13px] font-medium text-[#3c4043] hover:bg-[#f7f8fb]"
                    type="button"
                  >
                    <ArrowUpDown className="text-[#5f6368]" size={14} />
                    <span className="text-[#8b8e98]">Sort:</span>
                    {activeSortLabel}
                    <ChevronDown className="text-[#5f6368]" size={14} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {SORT_OPTIONS.map((option) => (
                    <DropdownMenuItem key={option.key} onSelect={() => chooseSort(option.key)}>
                      <Check
                        className={cn(option.key === sortKey ? 'opacity-100' : 'opacity-0')}
                        size={14}
                      />
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                aria-label={sortDir === 'asc' ? 'Ascending — switch to descending' : 'Descending — switch to ascending'}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-[6px] border border-[#e0e2e7] bg-white px-2.5 py-1.5 text-[13px] font-medium text-[#3c4043] hover:bg-[#f7f8fb]"
                onClick={() => setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'))}
                title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
                type="button"
              >
                {sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                {sortKey === 'name'
                  ? sortDir === 'asc'
                    ? 'A–Z'
                    : 'Z–A'
                  : sortDir === 'asc'
                    ? 'Oldest'
                    : 'Newest'}
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-8">
              {folders.length > 0 || isCreatingFolder ? (
                <section aria-labelledby="files-folders-heading">
                  <h2
                    className="m-0 mb-3 text-[13px] font-semibold tracking-[0.13px] text-[#5f6368]"
                    id="files-folders-heading"
                  >
                    Folders
                  </h2>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
                    {isCreatingFolder ? (
                      <NewFolderCard
                        onCancel={() => setIsCreatingFolder(false)}
                        onCommit={(name) => {
                          onCreateFolder(name, currentFolderId)
                          setIsCreatingFolder(false)
                        }}
                      />
                    ) : null}
                    {folders.map((folder) => (
                      <FolderCard
                        dragId={folder.id}
                        draggingId={draggingId}
                        folder={folder}
                        key={folder.id}
                        onDelete={() => deleteItem(folder)}
                        onDragEnd={endDrag}
                        onDragStart={setDraggingId}
                        onItemDrop={(draggedId) => {
                          endDrag()
                          onMoveItemInto(draggedId, folder.id)
                        }}
                        onMove={() => onMoveItem(folder.id)}
                        onOpen={() => openFolder(folder.id)}
                        onRename={(name) => onRenameItem(folder.id, name)}
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              <section aria-labelledby="files-files-heading">
                <h2
                  className="m-0 mb-3 text-[13px] font-semibold tracking-[0.13px] text-[#5f6368]"
                  id="files-files-heading"
                >
                  Files
                </h2>
                {files.length > 0 ? (
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(min(235px,100%),235px))] gap-x-8 gap-y-5.25 max-[560px]:grid-cols-1">
                    {files.map((file) => (
                      <div key={file.id} onContextMenu={stopContextMenu}>
                        <FormCard
                          dragId={file.id}
                          image={placeholderFormImage(Number(file.formId ?? file.id))}
                          onDelete={() => deleteItem(file)}
                          onDragEnd={endDrag}
                          onDragStart={setDraggingId}
                          onMove={() => onMoveItem(file.id)}
                          onOpen={() => openForm(file.formId ?? file.id)}
                          onRename={(name) => onRenameItem(file.id, name)}
                          title={file.label}
                          updatedAt={formatRelativeTime(file.updatedAt ?? file.createdAt)}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="m-0 text-[14px] text-[#8b8e98]">No file here</p>
                )}
              </section>
            </div>
          </PageContainer>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent onCloseAutoFocus={(event) => event.preventDefault()}>
        <ContextMenuItem
          onSelect={() => {
            setIsCreatingFolder(true)
          }}
        >
          <FolderPlus size={16} />
          New folder
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => onCreateForm(currentFolderId)}>
          <FilePlus size={16} />
          New form
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
