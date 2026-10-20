import { ChevronRight, FilePlus, Folder, FolderPlus } from 'lucide-react'
import { type DragEvent, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { FolderCard, NewFolderCard } from '../components/files/FolderCard'
import { SortControls } from '../components/files/SortControls'
import { DEFAULT_SORT_DIR, type SortDir, type SortKey } from '../components/files/sortOptions'
import { FormCard } from '../components/forms/FormCard'
import { PageContainer } from '../components/layout/PageContainer'
import { FolderCardGridSkeleton } from '../components/skeletons/FolderCardSkeleton'
import { FormCardGridSkeleton } from '../components/skeletons/FormCardSkeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import { SkeletonRegion } from '../components/ui/skeleton'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '../components/ui/context-menu'
import type { ProjectTreeItem } from '../data/dashboard'
import { showConfirm } from '../lib/alertDialog'
import { formatRelativeTime } from '../lib/formatRelativeTime'
import { formPath } from '../lib/formPath'
import { placeholderFormImage } from '../lib/formCardImage'
import { cn } from '../lib/utils'
import { folderContents, getFolderPath } from '../utils/projectTree'

export type FilesPageProps = {
  projects: ProjectTreeItem[]
  /** True while the project tree is still being fetched — shows placeholder cards. */
  isLoading?: boolean
  onCreateFolder: (name: string, parentFolderId: string | null) => void
  onCreateForm: (parentFolderId: string | null) => void
  onDeleteItem: (id: string) => void
  onMoveItem: (id: string) => void
  /** Direct move (drag-and-drop): put `id` into `folderId` (null = root). */
  onMoveItemInto: (id: string, folderId: string | null) => void
  onRenameItem: (id: string, label: string) => void
}

const ROOT_CRUMB = '__root__'

const compareByName = (a: ProjectTreeItem, b: ProjectTreeItem) =>
  a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' })

// `Date.parse(string)` is deterministic, so this is render-safe. Missing/unparseable → 0.
// Folders aren't opened themselves: their "Date opened" is the latest of any form inside.
const openedAt = (item: ProjectTreeItem): number =>
  item.type === 'folder'
    ? Math.max(0, ...(item.children ?? []).map(openedAt))
    : Date.parse(item.lastOpenedAt ?? '') || 0

const timeOf = (item: ProjectTreeItem, key: SortKey) =>
  key === 'opened'
    ? openedAt(item)
    : Date.parse((key === 'created' ? item.createdAt : item.updatedAt) ?? '') || 0

function sortItems(list: ProjectTreeItem[], sortKey: SortKey, sortDir: SortDir): ProjectTreeItem[] {
  const flip = sortDir === 'asc' ? 1 : -1
  const compare =
    sortKey === 'name'
      ? (a: ProjectTreeItem, b: ProjectTreeItem) => flip * compareByName(a, b)
      : (a: ProjectTreeItem, b: ProjectTreeItem) =>
          flip * (timeOf(a, sortKey) - timeOf(b, sortKey)) || compareByName(a, b)
  return [...list].sort(compare)
}

/** The time a card shows — the one the list is sorted by, so the order explains itself. */
function cardTime(item: ProjectTreeItem, sortKey: SortKey): { label: string; at: string | null | undefined } {
  if (sortKey === 'opened' && item.lastOpenedAt) return { label: 'Opened', at: item.lastOpenedAt }
  if (sortKey === 'created') return { label: 'Created', at: item.createdAt }
  return { label: 'Modified', at: item.updatedAt ?? item.createdAt }
}

// A right-click on a card should fall through to the browser, not open the page's
// "new file / new folder" menu — that belongs to genuine white space only.
function stopContextMenu(event: { stopPropagation: () => void }) {
  event.stopPropagation()
}

export function FilesPage({
  projects,
  isLoading = false,
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
    setSortDir(DEFAULT_SORT_DIR[key])
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

  function openFolder(id: string) {
    navigate(`/my-forms/${encodeURIComponent(id)}`)
  }

  function openForm(file: ProjectTreeItem) {
    navigate(file.urlId ? formPath(file.urlId) : `/forms/${encodeURIComponent(file.formId ?? file.id)}`)
  }

  async function deleteItem(item: ProjectTreeItem) {
    const contents = item.type === 'folder' ? folderContents(item) : null
    const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
    const inside = contents
      ? [
          contents.forms.length ? plural(contents.forms.length, 'form') : '',
          contents.folders ? plural(contents.folders, 'folder') : '',
        ].filter(Boolean)
      : []
    // Collected responses can't be got back — losing them takes typing the item's name.
    const responses = contents
      ? contents.forms.reduce((sum, form) => sum + (form.submissionCount ?? 0), 0)
      : (item.submissionCount ?? 0)
    const confirmed = await showConfirm({
      title: item.type === 'folder' ? 'Delete folder?' : 'Delete form?',
      message: inside.length
        ? `“${item.label}” and everything in it (${inside.join(' and ')}${responses ? `, with ${plural(responses, 'response')}` : ''}) will be deleted. This can't be undone.`
        : responses
          ? `“${item.label}” and its ${plural(responses, 'response')} will be deleted. This can't be undone.`
          : `“${item.label}” will be deleted. This can't be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
      typeToConfirm: responses > 0 ? item.label : undefined,
    })
    if (confirmed) onDeleteItem(item.id)
  }

  function endDrag() {
    setDraggingId(null)
    setDragOverCrumb(null)
  }

  // Drop handlers for a breadcrumb crumb (an ancestor folder, or `null` for root).
  // Deeper than this, the folders between root and the last two fold into "…".
  const MAX_CRUMBS = 3
  const hiddenCrumbs = path.length > MAX_CRUMBS ? path.slice(0, path.length - (MAX_CRUMBS - 1)) : []
  const visibleCrumbs = path.slice(hiddenCrumbs.length)

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
        <div className="min-h-[calc(100vh-50px)] min-[900px]:min-h-screen">
          <PageContainer>
            {/* Title row: the breadcrumb shrinks (long names truncate, deep paths fold into
                "…") so Sort keeps its place at the end; on phones Sort wraps below. */}
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-8 pb-1">
              <nav
                aria-label="Breadcrumb"
                className="flex min-w-0 flex-1 items-center gap-0.5 text-[22px] text-[#3c4043]"
              >
                <button
                  className="shrink-0 cursor-pointer rounded-[10px] px-1.5 py-1 font-medium whitespace-nowrap hover:bg-[#f7f8fb] disabled:cursor-default disabled:font-semibold disabled:hover:bg-transparent data-drop-over:bg-[#dbe7ff] data-drop-over:text-[#1e55c5]"
                  disabled={path.length === 0}
                  onClick={() => navigate('/my-forms')}
                  type="button"
                  {...crumbDropProps(null)}
                >
                  My forms
                </button>
                {hiddenCrumbs.length > 0 ? (
                  <span className="flex shrink-0 items-center gap-0.5">
                    <ChevronRight className="shrink-0 text-[#b0b1b3]" size={18} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          aria-label="Show folders in between"
                          className="cursor-pointer rounded-[10px] px-1.5 py-1 text-[#1e55c5] hover:bg-[#f7f8fb]"
                          type="button"
                        >
                          …
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {hiddenCrumbs.map((folder) => (
                          <DropdownMenuItem key={folder.id} onSelect={() => openFolder(folder.id)}>
                            <Folder size={14} />
                            {folder.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </span>
                ) : null}
                {visibleCrumbs.map((folder) => {
                  const isLast = folder.id === path[path.length - 1]?.id

                  return (
                    <span className="flex min-w-0 items-center gap-0.5" key={folder.id}>
                      <ChevronRight className="shrink-0 text-[#b0b1b3]" size={18} />
                      <button
                        className={cn(
                          'min-w-0 cursor-pointer truncate rounded-[10px] px-1.5 py-1 hover:bg-[#f7f8fb] disabled:cursor-default disabled:hover:bg-transparent data-drop-over:bg-[#dbe7ff] data-drop-over:text-[#1e55c5]',
                          isLast ? 'font-semibold' : 'max-w-60 text-[#1e55c5]',
                        )}
                        disabled={isLast}
                        onClick={() => openFolder(folder.id)}
                        title={folder.label}
                        type="button"
                        {...(isLast ? {} : crumbDropProps(folder.id))}
                      >
                        {folder.label}
                      </button>
                    </span>
                  )
                })}
              </nav>

              <SortControls
                keys={['name', 'opened', 'modified', 'created']}
                onSortDirChange={setSortDir}
                onSortKeyChange={chooseSort}
                sortDir={sortDir}
                sortKey={sortKey}
              />
            </div>

            {isLoading ? (
              <SkeletonRegion className="mt-4 flex flex-col gap-8" label="Loading files…">
                <FolderCardGridSkeleton />
                <FormCardGridSkeleton count={4} />
              </SkeletonRegion>
            ) : (
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
                          onDelete={() => void deleteItem(folder)}
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
                    Forms
                  </h2>
                  {files.length > 0 ? (
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(235px,100%),235px))] gap-x-8 gap-y-5.25 max-[560px]:grid-cols-1">
                      {files.map((file) => (
                        <div key={file.id} onContextMenu={stopContextMenu}>
                          <FormCard
                            dragId={file.id}
                            image={placeholderFormImage(Number(file.formId ?? file.id))}
                            onDelete={() => void deleteItem(file)}
                            onDragEnd={endDrag}
                            onDragStart={setDraggingId}
                            onMove={() => onMoveItem(file.id)}
                            onOpen={() => openForm(file)}
                            onRename={(name) => onRenameItem(file.id, name)}
                            title={file.label}
                            timeLabel={cardTime(file, sortKey).label}
                            updatedAt={formatRelativeTime(cardTime(file, sortKey).at ?? null)}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="m-0 text-[14px] text-[#8b8e98]">No file here</p>
                  )}
                </section>
              </div>
            )}
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
