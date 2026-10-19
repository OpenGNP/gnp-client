import {
  ChevronDown,
  ChevronRight,
  FilePlus,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  HardDrive,
  Home,
  LogOut,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  PlusCircle,
  Search,
  Smile,
  Users,
} from 'lucide-react'
import { type DragEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react'

import { SidebarTreeSkeleton } from '../skeletons/SidebarTreeSkeleton'
import { SearchDialog, type SearchResult } from './SearchDialog'
import type { ProjectTreeItem } from '../../data/dashboard'
import { cn } from '../../lib/utils'
import { findProjectById, isIdWithinItem } from '../../utils/projectTree'
import { Button } from '../ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

type SidebarUser = {
  name: string
  email: string
}

type SidebarBrand = {
  logo: string
  name: string
}

export type MoveTarget = { folderId: string | null; beforeId?: string | null }

type DropZone = 'before' | 'after' | 'into'
type DragOverTarget = { id: string; zone: DropZone } | null
const ROOT_DROP_ID = '__root__'

/**
 * Matches Tailwind v4's `max-[900px]` (= `width < 900px`), where the sidebar becomes
 * an overlay. Shared with App so the JS and CSS breakpoints can't disagree.
 */
export const NARROW_VIEWPORT_QUERY = '(max-width: 899.98px)'

export type SidebarProps = {
  brand: SidebarBrand
  user: SidebarUser
  projects: ProjectTreeItem[]
  /** True while the project tree is still being fetched — shows placeholder rows. */
  isLoading?: boolean
  /** True when the project tree failed to load — shows an error with a retry. */
  loadError?: boolean
  onRetryLoad?: () => void
  isCollapsed: boolean
  openFolderIds: Set<string>
  /** Tree-node id of the current route's item (`form-<id>` for forms, the folder id for folders). */
  selectedNodeId: string
  /** Which top nav entry the current route belongs to. */
  activeNav?: 'home' | 'files' | 'shared' | null
  onCreateFolder: (name: string) => void
  onCreateForm: () => void
  onGoFiles: () => void
  onGoShared: () => void
  onGoHome: () => void
  onLogout: () => void
  onMoveProject: (projectId: string, target: MoveTarget) => void
  /** A form shared with me, picked in search: opens its dashboard. */
  onOpenSharedForm: (urlId: string) => void
  onSelectProject: (item: ProjectTreeItem) => void
  onToggleCollapse: () => void
  onToggleFolder: (id: string) => void
}

type ProjectItemProps = {
  item: ProjectTreeItem
  parentFolderId: string | null
  siblings: ProjectTreeItem[]
  index: number
  isCollapsed?: boolean
  openFolderIds: Set<string>
  selectedNodeId: string
  draggedId: string | null
  /** The resolved item being dragged — lets a folder refuse to drop into its own subtree. */
  draggedItem: ProjectTreeItem | null
  dragOverTarget: DragOverTarget
  onDragStart: (id: string) => void
  onDragEnd: () => void
  onDragOverTarget: (target: DragOverTarget) => void
  onSelectProject: (item: ProjectTreeItem) => void
  onMoveProject: (projectId: string, target: MoveTarget) => void
  onToggleFolder: (id: string) => void
}

const navButtonClass =
  'flex h-[46px] w-full cursor-pointer items-center gap-2.5 rounded-[10px] border-0 bg-transparent text-left text-[16px] font-bold tracking-[0.16px] text-[#3f4045] transition-colors hover:bg-[#f7f8fb]'

const treeButtonClass =
  'flex h-[46px] w-full min-w-0 cursor-pointer items-center gap-2.5 rounded-[10px] border-0 bg-transparent p-2.5 text-left text-[#3f4045]'

// Distinct from the hover tint (#f7f8fb) so "where am I" never looks like "under the mouse".
const selectedRowClass = 'bg-[#edf2fd] text-[#1e55c5] hover:bg-[#edf2fd]'

const treeTextClass =
  '[&_span]:min-w-0 [&_span]:overflow-hidden [&_span]:text-ellipsis [&_span]:whitespace-nowrap [&_span]:text-[16px] [&_span]:leading-[22px] [&_span]:font-bold [&_span]:tracking-[0.16px] [&_svg]:shrink-0'

function SidebarHeader({
  brand,
  onToggleCollapse,
}: {
  brand: SidebarBrand
  onToggleCollapse: () => void
}) {
  return (
    <div className="flex h-22 items-center justify-between py-0 pr-6 pl-5.25">
      <img
        src={brand.logo}
        alt={brand.name}
        className="h-9.5 w-18.25 object-cover object-center"
      />
      <Button
        className="size-10 text-[#3f4045]"
        aria-label="Collapse sidebar"
        onClick={onToggleCollapse}
        size="icon"
        title="Collapse sidebar"
        variant="ghost"
      >
        <PanelLeftClose className="size-6" strokeWidth={2} />
      </Button>
    </div>
  )
}

/** The "/" search shortcut — ignored while typing in a field or with a modifier held. */
function isSearchShortcut(event: globalThis.KeyboardEvent): boolean {
  // `code` is the physical key, so it still works with the Thai layout on (that key types "ฝ").
  const isSlash = event.key === '/' || event.code === 'Slash'
  if (!isSlash || event.metaKey || event.ctrlKey || event.altKey) return false
  const target = event.target as HTMLElement | null
  return !target?.closest('input, textarea, select, [contenteditable="true"]')
}

/** What to do once the full sidebar opens, when it was opened from a rail shortcut. */
type ExpandAction = 'create-folder' | null

// Full-size icons (same as the expanded sidebar) with a small label underneath.
const railRowClass =
  'flex w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-[10px] border-0 bg-transparent py-2 text-[#3f4045] transition-colors hover:bg-[#f7f8fb]'
const railLabelClass = 'text-[11px] leading-3.5 font-semibold tracking-[0.11px]'

/**
 * Desktop's collapsed sidebar: the same sections as the full sidebar, squeezed to
 * an icon column with labels — header (expand), Home / Files between the same
 * dividers, the "My Project" Create button + search, and the profile at the bottom.
 * The project tree only lives in the full sidebar; "Create folder" opens it.
 * Hidden below 900px, where a collapsed sidebar disappears entirely.
 */
function SidebarRail({
  activeNav,
  user,
  onCreateForm,
  onExpand,
  onOpenSearch,
  onGoFiles,
  onGoShared,
  onGoHome,
  onLogout,
}: {
  activeNav: 'home' | 'files' | 'shared' | null
  user: SidebarUser
  onCreateForm: () => void
  onExpand: (action: ExpandAction) => void
  onOpenSearch: () => void
  onGoFiles: () => void
  onGoShared: () => void
  onGoHome: () => void
  onLogout: () => void
}) {
  return (
    <aside
      aria-label="Primary navigation"
      className="sticky top-0 z-30 flex h-screen w-19.5 shrink-0 flex-col border-r-2 border-[#e8eaf1] bg-white max-[900px]:hidden"
    >
      {/* Header — same height as SidebarHeader */}
      <div className="flex h-22 shrink-0 items-center justify-center">
        <Button
          aria-label="Expand sidebar"
          className="size-10 text-[#3f4045]"
          onClick={() => onExpand(null)}
          size="icon"
          title="Expand sidebar"
          variant="ghost"
        >
          <PanelLeftOpen className="size-6" strokeWidth={2} />
        </Button>
      </div>

      {/* Home / Files — same block as HomeNav */}
      <nav aria-label="Main" className="border-y border-[#e8eaf1] py-2">
        {(
          [
            { key: 'home', label: 'Home', icon: Home, onClick: onGoHome },
            { key: 'files', label: 'Files', icon: HardDrive, onClick: onGoFiles },
            { key: 'shared', label: 'Shared', icon: Users, onClick: onGoShared },
          ] as const
        ).map(({ key, label, icon: Icon, onClick }) => {
          const isActive = activeNav === key
          return (
            <button
              aria-current={isActive ? 'page' : undefined}
              aria-label={label}
              className={cn(
                railRowClass,
                'rounded-none',
                isActive && 'bg-[#edf2fd] text-[#1e55c5] hover:bg-[#edf2fd]',
              )}
              key={key}
              onClick={onClick}
              title={label}
              type="button"
            >
              <Icon size={26} strokeWidth={2.1} />
              <span className={railLabelClass}>{label}</span>
            </button>
          )
        })}
      </nav>

      {/* "My Project" — Create + search */}
      <div className="flex flex-col gap-3 px-3 pt-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Create"
              className="flex w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-[10px] border-0 bg-[#1e55c5] py-2 text-white transition-colors hover:bg-[#1a49aa]"
              title="Create"
              type="button"
            >
              <PlusCircle size={21} />
              <span className={railLabelClass}>Create</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            side="right"
            onCloseAutoFocus={(event) => event.preventDefault()}
          >
            <DropdownMenuItem onSelect={onCreateForm}>
              <FilePlus size={16} />
              Create form
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onExpand('create-folder')}>
              <FolderPlus size={16} />
              Create folder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <button
          aria-label="Search"
          className="flex w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-[10px] border border-[#e9ebf0] bg-transparent py-2 text-[#6e7180] transition-colors hover:border-[#d7dbe6] hover:text-[#3f4045]"
          onClick={onOpenSearch}
          title="Search forms"
          type="button"
        >
          <Search size={20} />
          <span className={railLabelClass}>Search</span>
        </button>
      </div>

      {/* Profile — same strip as UserProfile */}
      <div className="mt-auto flex h-20.75 shrink-0 items-center justify-center border-t border-[#eef1f5]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Account options"
              className="flex size-7.75 cursor-pointer items-center justify-center rounded-full border-0 bg-[#4c71f7] text-white transition-shadow hover:ring-4 hover:ring-[#4c71f7]/20"
              title={user.name}
              type="button"
            >
              <Smile size={19} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-50" side="right">
            <div className="px-2 py-1.5">
              <p className="m-0 truncate text-[13px] font-semibold text-[#3f4045]">{user.name}</p>
              <p className="m-0 truncate text-[12px] text-[#888683]">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onLogout}>
              <LogOut size={14} />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}

function HomeNav({
  activeNav,
  isCollapsed,
  onGoFiles,
  onGoShared,
  onGoHome,
}: {
  activeNav: 'home' | 'files' | 'shared' | null
  isCollapsed: boolean
  onGoFiles: () => void
  onGoShared: () => void
  onGoHome: () => void
}) {
  const itemClass = (isActive: boolean) =>
    cn(
      navButtonClass,
      'px-6.5 py-0',
      isCollapsed && 'justify-center px-0',
      isActive && 'bg-[#edf2fd] text-[#1e55c5] hover:bg-[#edf2fd]',
    )

  return (
    <nav
      className={cn('border-y border-[#e8eaf1] py-2', isCollapsed && 'px-3')}
      aria-label="Main"
    >
      <button
        aria-current={activeNav === 'home' ? 'page' : undefined}
        className={itemClass(activeNav === 'home')}
        onClick={onGoHome}
        type="button"
      >
        <Home size={26} strokeWidth={2.1} />
        {!isCollapsed ? <span>Home</span> : null}
      </button>
      <button
        aria-current={activeNav === 'files' ? 'page' : undefined}
        className={itemClass(activeNav === 'files')}
        onClick={onGoFiles}
        type="button"
      >
        <HardDrive size={26} strokeWidth={2.1} />
        {!isCollapsed ? <span>Files</span> : null}
      </button>
      <button
        aria-current={activeNav === 'shared' ? 'page' : undefined}
        className={itemClass(activeNav === 'shared')}
        onClick={onGoShared}
        type="button"
      >
        <Users size={26} strokeWidth={2.1} />
        {!isCollapsed ? <span>Shared with me</span> : null}
      </button>
    </nav>
  )
}

function ProjectItem({
  item,
  parentFolderId,
  siblings,
  index,
  isCollapsed = false,
  openFolderIds,
  selectedNodeId,
  draggedId,
  draggedItem,
  dragOverTarget,
  onDragStart,
  onDragEnd,
  onDragOverTarget,
  onSelectProject,
  onMoveProject,
  onToggleFolder,
}: ProjectItemProps) {
  const isFolder = item.type === 'folder'
  // A folder can't be dropped onto itself or any row inside it.
  const rejectsDraggedItem =
    draggedItem?.type === 'folder' && isIdWithinItem(draggedItem, item.id)
  const isOpen = isFolder && openFolderIds.has(item.id)
  // Compared by tree-node id only: a form's node id is `form-<id>`, a folder's is its
  // bare id, so form #2 and folder #2 can't both light up.
  const isSelected = item.id === selectedNodeId
  const isDragging = draggedId === item.id
  const zone = dragOverTarget?.id === item.id ? dragOverTarget.zone : null
  const Icon = isFolder ? (isOpen ? FolderOpen : Folder) : FileText
  const childCount = item.children?.length ?? 0

  // Keep the current item visible when it's selected from elsewhere (Home card,
  // deep link) or its folder was just auto-expanded.
  const rowRef = useRef<HTMLDivElement & HTMLButtonElement>(null)
  useEffect(() => {
    if (isSelected) {
      rowRef.current?.scrollIntoView({ block: 'nearest' })
    }
  }, [isSelected])

  function handleSelect() {
    onSelectProject(item)
  }

  function handleDragStart(event: DragEvent<HTMLElement>) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', item.id)
    onDragStart(item.id)
  }

  // Splits the row into drop zones by cursor position: top/bottom strips reorder
  // (before/after this item), the middle band — folders only — moves inside instead.
  // A document row has no "into" zone since it can't hold children, so it's a plain
  // 50/50 split.
  function handleDragOver(event: DragEvent<HTMLElement>) {
    if (draggedId === item.id || rejectsDraggedItem) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = 'move'

    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = rect.height > 0 ? (event.clientY - rect.top) / rect.height : 0.5
    const nextZone: DropZone = isFolder
      ? ratio < 0.25
        ? 'before'
        : ratio > 0.75
          ? 'after'
          : 'into'
      : ratio < 0.5
        ? 'before'
        : 'after'

    // Skip the state update (and the re-render it triggers) when nothing actually
    // changed — dragover fires continuously while the mouse sits still over a row.
    if (dragOverTarget?.id !== item.id || dragOverTarget.zone !== nextZone) {
      onDragOverTarget({ id: item.id, zone: nextZone })
    }
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault()
    event.stopPropagation()

    const draggedProjectId = event.dataTransfer.getData('text/plain')
    const resolvedZone = zone ?? (isFolder ? 'into' : 'after')
    onDragEnd()

    if (!draggedProjectId || draggedProjectId === item.id || rejectsDraggedItem) {
      return
    }

    if (resolvedZone === 'into') {
      onMoveProject(draggedProjectId, { folderId: item.id })
      return
    }

    let beforeId: string | null = item.id
    if (resolvedZone === 'after') {
      beforeId = null
      for (let i = index + 1; i < siblings.length; i += 1) {
        if (siblings[i].id !== draggedProjectId) {
          beforeId = siblings[i].id
          break
        }
      }
    }
    onMoveProject(draggedProjectId, { folderId: parentFolderId, beforeId })
  }

  const dropZoneClass = cn(
    zone === 'into' && 'ring-2 ring-[#1e55c5]/30',
    zone === 'before' && 'shadow-[inset_0_2px_0_0_#1e55c5]',
    zone === 'after' && 'shadow-[inset_0_-2px_0_0_#1e55c5]',
  )

  if (isFolder) {
    return (
      <Collapsible
        open={Boolean(isOpen)}
        onOpenChange={() => onToggleFolder(item.id)}
      >
        <div
          className={cn(
            treeButtonClass,
            treeTextClass,
            'gap-1.5 pl-1 transition-colors hover:bg-[#f7f8fb]',
            isSelected && selectedRowClass,
            isDragging && 'opacity-40',
            dropZoneClass,
            // Not saved yet (see App's handleCreateFolder): visible, but nothing to do with it.
            item.pending && 'pointer-events-none opacity-60',
          )}
          draggable={!item.pending}
          inert={item.pending}
          ref={rowRef}
          title={isCollapsed ? item.label : undefined}
          onDragEnd={onDragEnd}
          onDragOver={handleDragOver}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
        >
          <CollapsibleTrigger asChild>
            <button
              aria-label={isOpen ? `Collapse ${item.label}` : `Expand ${item.label}`}
              className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded text-[#8a8d97] transition-colors hover:bg-black/10 hover:text-[#3f4045]"
              type="button"
            >
              <ChevronRight
                className={cn('transition-transform duration-150', isOpen && 'rotate-90')}
                size={18}
                strokeWidth={2.4}
              />
            </button>
          </CollapsibleTrigger>
          <button
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 text-left"
            onClick={handleSelect}
            type="button"
          >
            <Icon size={22} />
            <span title={item.label}>{item.label}</span>
          </button>
          {childCount > 0 ? (
            <em
              aria-label={`${childCount} item${childCount === 1 ? '' : 's'}`}
              className="ml-auto shrink-0 rounded-full bg-[#eef1f6] px-1.75 text-[11px] leading-4.5 font-semibold text-[#6e7180] not-italic"
            >
              {childCount}
            </em>
          ) : null}
        </div>
        {childCount === 0 ? (
          <CollapsibleContent className="ml-8 w-[calc(100%-32px)]">
            <p className="m-0 py-2 pl-2.5 text-[13px] font-medium text-[#8a8d97]">
              Empty folder
            </p>
          </CollapsibleContent>
        ) : (
          <CollapsibleContent className="ml-8 w-[calc(100%-32px)]">
            {(item.children ?? []).map((child, childIndex) => (
              <ProjectItem
                item={child}
                key={child.id}
                parentFolderId={item.id}
                siblings={item.children ?? []}
                index={childIndex}
                isCollapsed={isCollapsed}
                openFolderIds={openFolderIds}
                selectedNodeId={selectedNodeId}
                draggedId={draggedId}
                draggedItem={draggedItem}
                dragOverTarget={dragOverTarget}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDragOverTarget={onDragOverTarget}
                onMoveProject={onMoveProject}
                onSelectProject={onSelectProject}
                onToggleFolder={onToggleFolder}
              />
            ))}
          </CollapsibleContent>
        )}
      </Collapsible>
    )
  }

  return (
    <button
      className={cn(
        treeButtonClass,
        treeTextClass,
        'cursor-grab transition-colors hover:bg-[#f7f8fb] active:cursor-grabbing',
        isSelected && selectedRowClass,
        isDragging && 'opacity-40',
        dropZoneClass,
      )}
      ref={rowRef}
      type="button"
      aria-current={isSelected ? 'page' : undefined}
      draggable
      title={isCollapsed ? item.label : undefined}
      onClick={handleSelect}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDragStart={handleDragStart}
      onDrop={handleDrop}
    >
      <Icon size={22} />
      <span title={item.label}>{item.label}</span>
    </button>
  )
}

function NewFolderRow({
  onCommit,
  onCancel,
}: {
  onCommit: (name: string) => void
  onCancel: () => void
}) {
  const [value, setValue] = useState('')
  const isDoneRef = useRef(false)
  const hasFocusedRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const focus = () => inputRef.current?.focus()
    focus()
    // Re-focus after a frame in case something (e.g. the dropdown closing) steals it.
    const frame = requestAnimationFrame(focus)
    return () => cancelAnimationFrame(frame)
  }, [])

  function commit() {
    if (isDoneRef.current) {
      return
    }
    isDoneRef.current = true

    const trimmed = value.trim()
    if (trimmed) {
      onCommit(trimmed)
    } else {
      onCancel()
    }
  }

  function handleBlur() {
    // Ignore a blur that happens before the user ever focused the field — it's the
    // dropdown handing focus back to its trigger as it closes, not the user leaving.
    if (hasFocusedRef.current) {
      commit()
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      commit()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      isDoneRef.current = true
      onCancel()
    }
  }

  return (
    <div className={cn(treeButtonClass, treeTextClass)}>
      <FolderOpen size={24} className="text-[#1e55c5]" />
      <input
        aria-label="Folder name"
        className="min-w-0 flex-1 border-0 bg-transparent text-[16px] leading-5.5 font-bold tracking-[0.16px] text-[#3f4045] outline-0 placeholder:font-medium placeholder:text-[#8a8d97]"
        onBlur={handleBlur}
        onChange={(event) => setValue(event.target.value)}
        onFocus={() => {
          hasFocusedRef.current = true
        }}
        onKeyDown={handleKeyDown}
        placeholder="Folder name"
        ref={inputRef}
        value={value}
      />
    </div>
  )
}

function ProjectNavigation({
  expandAction = null,
  projects,
  isLoading = false,
  loadError = false,
  onRetryLoad,
  openFolderIds,
  selectedNodeId,
  onCreateFolder,
  onCreateForm,
  onOpenSearch,
  onSelectProject,
  onMoveProject,
  onToggleFolder,
}: Omit<
  SidebarProps,
  | 'brand'
  | 'user'
  | 'isCollapsed'
  | 'activeNav'
  | 'onGoFiles'
  | 'onGoShared'
  | 'onGoHome'
  | 'onLogout'
  | 'onToggleCollapse'
  | 'onOpenSharedForm'
> & { expandAction?: ExpandAction; onOpenSearch: () => void }) {
  // Opened from the rail's "Create folder": start with the new-folder row showing.
  const [isCreatingFolder, setIsCreatingFolder] = useState(expandAction === 'create-folder')
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverTarget, setDragOverTarget] = useState<DragOverTarget>(null)
  const draggedItem = draggedId ? findProjectById(projects, draggedId) : null

  function updateDragOverTarget(target: DragOverTarget) {
    setDragOverTarget((current) => {
      if (current?.id === target?.id && current?.zone === target?.zone) {
        return current
      }
      return target
    })
  }

  function handleDragEnd() {
    setDraggedId(null)
    setDragOverTarget(null)
  }

  function handleRootDragOver(event: DragEvent<HTMLElement>) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    updateDragOverTarget({ id: ROOT_DROP_ID, zone: 'into' })
  }

  function handleRootDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault()
    const draggedProjectId = event.dataTransfer.getData('text/plain')
    handleDragEnd()

    if (draggedProjectId) {
      onMoveProject(draggedProjectId, { folderId: null })
    }
  }

  return (
    <section
      className={cn(
        'min-h-0 flex-1 overflow-y-auto px-5 pt-5.75 pb-6 max-[900px]:pb-4',
        dragOverTarget?.id === ROOT_DROP_ID && 'bg-[#f0f4ff]',
      )}
      aria-labelledby="project-nav-title"
      onDragOver={handleRootDragOver}
      onDrop={handleRootDrop}
    >
      <h2
        className="mt-0 mr-0 mb-3.25 ml-0.75 text-[14px] leading-5.5 font-medium tracking-[0.14px] text-black"
        id="project-nav-title"
      >
        My Project
      </h2>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="group/create flex h-11.5 w-full cursor-pointer items-center justify-center gap-2.5 rounded-[10px] border-0 bg-[#1e55c5] text-[16px] font-bold tracking-[0.16px] text-white transition-colors hover:bg-[#1a49aa]"
            type="button"
          >
            <PlusCircle size={21} />
            <span>Create</span>
            <ChevronDown
              className="transition-transform group-data-[state=open]/create:rotate-180"
              size={18}
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-(--radix-dropdown-menu-trigger-width)"
          onCloseAutoFocus={(event) => event.preventDefault()}
        >
          <DropdownMenuItem onSelect={onCreateForm}>
            <FilePlus size={16} />
            Create form
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setIsCreatingFolder(true)}
          >
            <FolderPlus size={16} />
            Create folder
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {/* Looks like a search box, opens the search dialog (like Notion). */}
      <button
        className="mt-4 mb-5.25 flex h-10.5 w-full cursor-pointer items-center gap-2 rounded-lg border border-[#e9ebf0] bg-transparent px-2.5 text-left text-[#6e7180] transition-colors hover:border-[#d7dbe6] hover:bg-[#f7f8fb]"
        onClick={onOpenSearch}
        type="button"
      >
        <Search className="shrink-0" size={20} />
        <span className="min-w-0 flex-1 text-[14px] font-medium">Search forms...</span>
        <kbd
          aria-hidden="true"
          className="shrink-0 rounded border border-[#e0e2e7] px-1.5 font-sans text-[11px] leading-4.5 font-semibold text-[#8a8d97]"
          title="Press / to search"
        >
          /
        </kbd>
      </button>

      <div className="flex flex-col items-stretch">
        {isCreatingFolder ? (
          <NewFolderRow
            onCancel={() => setIsCreatingFolder(false)}
            onCommit={(name) => {
              onCreateFolder(name)
              setIsCreatingFolder(false)
            }}
          />
        ) : null}
        {isLoading ? (
          <SidebarTreeSkeleton />
        ) : loadError ? (
          <div className="flex flex-col items-start gap-2 p-2.5" role="alert">
            <p className="m-0 text-[14px] font-medium text-[#e0507a]">Couldn't load your forms.</p>
            {onRetryLoad ? (
              <button
                className="cursor-pointer rounded-[10px] border border-[#e0507a] px-3 py-1 text-[13px] font-medium text-[#e0507a] transition-colors hover:bg-[#fcf3f6]"
                onClick={onRetryLoad}
                type="button"
              >
                Try again
              </button>
            ) : null}
          </div>
        ) : projects.length > 0 ? (
          projects.map((project, index) => (
            <ProjectItem
              item={project}
              key={project.id}
              parentFolderId={null}
              siblings={projects}
              index={index}
              openFolderIds={openFolderIds}
              selectedNodeId={selectedNodeId}
              draggedId={draggedId}
              draggedItem={draggedItem}
              dragOverTarget={dragOverTarget}
              onDragStart={setDraggedId}
              onDragEnd={handleDragEnd}
              onDragOverTarget={updateDragOverTarget}
              onMoveProject={onMoveProject}
              onSelectProject={onSelectProject}
              onToggleFolder={onToggleFolder}
            />
          ))
        ) : isCreatingFolder ? null : (
          <p className="m-0 p-2.5 text-[14px] leading-5 font-medium tracking-[0.14px] text-[#6e7180]">
            No forms yet. Use <strong className="text-[#3f4045]">Create</strong> to make your first
            form or folder.
          </p>
        )}
      </div>
    </section>
  )
}

function UserProfile({ user, onLogout }: { user: SidebarUser; onLogout: () => void }) {
  return (
    <div className="flex h-20.75 items-center gap-2.5 border-t border-[#eef1f5] pr-5.75 pl-7.25">
      <div className="flex size-7.75 shrink-0 items-center justify-center rounded-full bg-[#4c71f7] text-white">
        <Smile size={19} />
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <strong className="block overflow-hidden text-ellipsis whitespace-nowrap text-[16px] font-semibold tracking-[0.16px] text-[#3f4045]">
          {user.name}
        </strong>
        <span className="mt-0.5 block overflow-hidden text-ellipsis whitespace-nowrap text-[12px] font-medium tracking-[0.12px] text-[#888683]">
          {user.email}
        </span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="size-10 text-[#3f4045]"
            aria-label="Profile options"
            size="icon"
            variant="ghost"
          >
            <MoreHorizontal className="size-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-35">
          <DropdownMenuItem onSelect={onLogout}>
            <LogOut size={14} />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export function Sidebar({
  activeNav = null,
  brand,
  isCollapsed,
  isLoading,
  loadError,
  onRetryLoad,
  openFolderIds,
  projects,
  selectedNodeId,
  user,
  onCreateFolder,
  onCreateForm,
  onGoFiles,
  onGoShared,
  onGoHome,
  onLogout,
  onMoveProject,
  onOpenSharedForm,
  onSelectProject,
  onToggleCollapse,
  onToggleFolder,
}: SidebarProps) {
  const [expandAction, setExpandAction] = useState<ExpandAction>(null)

  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // "/" opens search from any page, sidebar open or not.
  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (!isSearchShortcut(event)) return
      event.preventDefault()
      setIsSearchOpen(true)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const searchDialog = (
    <SearchDialog
      onOpenChange={setIsSearchOpen}
      onOpenResult={(result: SearchResult) =>
        result.kind === 'shared' ? onOpenSharedForm(result.urlId) : onSelectProject(result.item)
      }
      open={isSearchOpen}
      projects={projects}
    />
  )

  if (isCollapsed) {
    return (
      <>
      <SidebarRail
        activeNav={activeNav}
        user={user}
        onCreateForm={onCreateForm}
        onExpand={(action) => {
          setExpandAction(action)
          onToggleCollapse()
        }}
        onGoFiles={onGoFiles}
        onGoShared={onGoShared}
        onGoHome={onGoHome}
        onLogout={onLogout}
        onOpenSearch={() => setIsSearchOpen(true)}
      />
      {searchDialog}
      </>
    )
  }

  return (
    <>
    {/* Narrow screens: the sidebar overlays the page, so dim it and close on tap. */}
    <div
      aria-hidden="true"
      className="fixed inset-0 z-39 bg-[#0f172a]/30 min-[900px]:hidden"
      onClick={onToggleCollapse}
    />
    <aside
      className={cn(
        'sticky top-0 z-30 flex h-screen shrink-0 flex-col border-r-2 border-[#e8eaf1] bg-white transition-[width,flex-basis] duration-200 ease-in-out',
        'max-[900px]:fixed max-[900px]:inset-y-0 max-[900px]:left-0 max-[900px]:z-40 max-[900px]:h-dvh max-[900px]:border-b-0 max-[900px]:shadow-2xl',
        'w-78.25 basis-78.25 max-[1200px]:w-71.5 max-[1200px]:basis-71.5 max-[900px]:w-[min(313px,calc(100vw_-_24px))] max-[900px]:basis-auto',
      )}
      aria-label="Primary navigation"
      onKeyDown={(event) => {
        // Esc closes the overlay on narrow screens (no-op layout-wise on desktop).
        if (event.key === 'Escape' && window.matchMedia(NARROW_VIEWPORT_QUERY).matches) {
          onToggleCollapse()
        }
      }}
    >
      <SidebarHeader
        brand={brand}
        onToggleCollapse={() => {
          setExpandAction(null)
          onToggleCollapse()
        }}
      />
      <HomeNav
        activeNav={activeNav}
        isCollapsed={isCollapsed}
        onGoFiles={onGoFiles}
        onGoShared={onGoShared}
        onGoHome={onGoHome}
      />
      {!isCollapsed ? (
        <>
          <ProjectNavigation
            expandAction={expandAction}
            isLoading={isLoading}
            loadError={loadError}
            onRetryLoad={onRetryLoad}
            projects={projects}
            openFolderIds={openFolderIds}
            selectedNodeId={selectedNodeId}
            onCreateFolder={onCreateFolder}
            onCreateForm={onCreateForm}
            onMoveProject={onMoveProject}
            onOpenSearch={() => setIsSearchOpen(true)}
            onSelectProject={onSelectProject}
            onToggleFolder={onToggleFolder}
          />
          <UserProfile onLogout={onLogout} user={user} />
        </>
      ) : null}
    </aside>
    {searchDialog}
    </>
  )
}
