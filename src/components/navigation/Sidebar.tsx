import {
  ChevronDown,
  ChevronLeft,
  FilePlus,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  HardDrive,
  Home,
  MoreHorizontal,
  PlusCircle,
  Search,
  Smile,
} from 'lucide-react'
import { type DragEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react'

import type { ProjectTreeItem } from '../../data/dashboard'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

// A drop can land in one of three zones on a row: the top strip reorders the dragged
// item to just above it, the bottom strip to just below it, and (folders only) the
// middle band moves it inside. The sentinel id lets the same state double as "hovering
// empty space below the list", so dropping there moves the item back to root.
type DropZone = 'before' | 'after' | 'into'
type DragOverTarget = { id: string; zone: DropZone } | null
const ROOT_DROP_ID = '__root__'

export type SidebarProps = {
  brand: SidebarBrand
  user: SidebarUser
  projects: ProjectTreeItem[]
  isCollapsed: boolean
  openFolderIds: Set<string>
  searchTerm: string
  selectedProjectId: string
  onCreateFolder: (name: string) => void
  onCreateForm: () => void
  onGoFiles: () => void
  onGoHome: () => void
  onMoveProject: (projectId: string, target: MoveTarget) => void
  onSearchChange: (value: string) => void
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
  searchTerm: string
  selectedProjectId: string
  draggedId: string | null
  dragOverTarget: DragOverTarget
  onDragStart: (id: string) => void
  onDragEnd: () => void
  onDragOverTarget: (target: DragOverTarget) => void
  onSelectProject: (item: ProjectTreeItem) => void
  onMoveProject: (projectId: string, target: MoveTarget) => void
  onToggleFolder: (id: string) => void
}

const navButtonClass =
  'flex h-[46px] w-full cursor-pointer items-center gap-2.5 rounded-[5px] border-0 bg-transparent text-left text-[16px] font-bold tracking-[0.16px] text-[#3f4045] transition-colors hover:bg-[#f7f8fb]'

const treeButtonClass =
  'flex h-[46px] w-full min-w-0 cursor-pointer items-center gap-2.5 rounded-[5px] border-0 bg-transparent p-2.5 text-left text-[#3f4045]'

const treeTextClass =
  '[&_span]:min-w-0 [&_span]:overflow-hidden [&_span]:text-ellipsis [&_span]:whitespace-nowrap [&_span]:text-[16px] [&_span]:leading-[22px] [&_span]:font-bold [&_span]:tracking-[0.16px] [&_svg]:shrink-0'

function itemMatchesSearch(item: ProjectTreeItem, searchTerm: string) {
  return item.label.toLowerCase().includes(searchTerm.toLowerCase())
}

function filterProjects(
  projects: ProjectTreeItem[],
  searchTerm: string,
): ProjectTreeItem[] {
  const normalizedTerm = searchTerm.trim()

  if (!normalizedTerm) {
    return projects
  }

  return projects.reduce<ProjectTreeItem[]>((filteredProjects, project) => {
    const children = project.children
      ? filterProjects(project.children, normalizedTerm)
      : undefined
    const matches = itemMatchesSearch(project, normalizedTerm)

    if (!matches && (!children || children.length === 0)) {
      return filteredProjects
    }

    filteredProjects.push({ ...project, children })

    return filteredProjects
  }, [])
}

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
        variant="ghost"
      >
        <ChevronLeft className="size-6.5" strokeWidth={2.4} />
      </Button>
    </div>
  )
}

function HomeNav({
  isCollapsed,
  onGoFiles,
  onGoHome,
}: {
  isCollapsed: boolean
  onGoFiles: () => void
  onGoHome: () => void
}) {
  const itemClass = cn(
    navButtonClass,
    'px-6.5 py-0',
    isCollapsed && 'justify-center px-0',
  )

  return (
    <nav
      className={cn('border-y border-[#e8eaf1] py-2', isCollapsed && 'px-3')}
      aria-label="Main"
    >
      <button className={itemClass} onClick={onGoHome} type="button">
        <Home size={26} strokeWidth={2.1} />
        {!isCollapsed ? <span>Home</span> : null}
      </button>
      <button className={itemClass} onClick={onGoFiles} type="button">
        <HardDrive size={26} strokeWidth={2.1} />
        {!isCollapsed ? <span>Files</span> : null}
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
  searchTerm,
  selectedProjectId,
  draggedId,
  dragOverTarget,
  onDragStart,
  onDragEnd,
  onDragOverTarget,
  onSelectProject,
  onMoveProject,
  onToggleFolder,
}: ProjectItemProps) {
  const isFolder = item.type === 'folder'
  const isOpen = isFolder && (openFolderIds.has(item.id) || Boolean(searchTerm.trim()))
  const isSelected =
    item.id === selectedProjectId || item.formId === selectedProjectId
  const isDragging = draggedId === item.id
  const zone = dragOverTarget?.id === item.id ? dragOverTarget.zone : null
  const Icon = isFolder ? (isOpen ? FolderOpen : Folder) : FileText

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
    if (draggedId === item.id) {
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
    // Don't wait on the dragged row's own `dragend` to clear its dimmed state — when a
    // drop actually moves it, React can unmount/remount that DOM node during the
    // resulting re-render before the browser gets to dispatch `dragend` on it, leaving
    // it stuck dimmed. Clearing here, from the *target's* handler, doesn't have that
    // problem (this element isn't the one being moved).
    onDragEnd()

    if (!draggedProjectId || draggedProjectId === item.id) {
      return
    }

    if (resolvedZone === 'into') {
      onMoveProject(draggedProjectId, { folderId: item.id })
      return
    }

    // "After this row" means "before whichever sibling currently follows it" — but if
    // that follower happens to be the dragged item itself (dropping on the row right
    // above where it already sits), skip forward to the next one, or it would resolve
    // to "before itself", not be found once removed, and silently append at the end.
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
            'transition-colors hover:bg-[#f7f8fb]',
            isOpen && 'text-[#1e55c5]',
            isSelected && 'bg-[#f7f8fb] text-[#1e55c5]',
            isDragging && 'opacity-40',
            dropZoneClass,
          )}
          draggable
          title={isCollapsed ? item.label : undefined}
          onDragEnd={onDragEnd}
          onDragOver={handleDragOver}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
        >
          <CollapsibleTrigger asChild>
            <button
              aria-label={isOpen ? `Collapse ${item.label}` : `Expand ${item.label}`}
              className="-m-0.5 flex shrink-0 cursor-pointer items-center rounded p-0.5 transition-colors hover:bg-black/10"
              type="button"
            >
              <Icon size={24} />
            </button>
          </CollapsibleTrigger>
          <button
            className="flex min-w-0 flex-1 cursor-pointer items-center text-left"
            onClick={handleSelect}
            type="button"
          >
            <span>{item.label}</span>
          </button>
        </div>
        {item.children && item.children.length > 0 ? (
          <CollapsibleContent className="ml-8 w-[calc(100%-32px)]">
            {item.children.map((child, childIndex) => (
              <ProjectItem
                item={child}
                key={child.id}
                parentFolderId={item.id}
                siblings={item.children ?? []}
                index={childIndex}
                isCollapsed={isCollapsed}
                openFolderIds={openFolderIds}
                searchTerm={searchTerm}
                selectedProjectId={selectedProjectId}
                draggedId={draggedId}
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
        ) : null}
      </Collapsible>
    )
  }

  return (
    <button
      className={cn(
        treeButtonClass,
        treeTextClass,
        'cursor-grab transition-colors hover:bg-[#f7f8fb] active:cursor-grabbing',
        isSelected && 'bg-[#f7f8fb] text-[#1e55c5]',
        isDragging && 'opacity-40',
        dropZoneClass,
      )}
      type="button"
      aria-pressed={isSelected}
      draggable
      title={isCollapsed ? item.label : undefined}
      onClick={handleSelect}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDragStart={handleDragStart}
      onDrop={handleDrop}
    >
      <Icon size={22} />
      <span>{item.label}</span>
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
  projects,
  openFolderIds,
  searchTerm,
  selectedProjectId,
  onCreateFolder,
  onCreateForm,
  onSearchChange,
  onSelectProject,
  onMoveProject,
  onToggleFolder,
}: Omit<
  SidebarProps,
  'brand' | 'user' | 'isCollapsed' | 'onGoFiles' | 'onGoHome' | 'onToggleCollapse'
>) {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverTarget, setDragOverTarget] = useState<DragOverTarget>(null)
  const visibleProjects = filterProjects(projects, searchTerm)

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

  // Fires only when a drag is over genuine empty space — every row's own drag handlers
  // call stopPropagation, so this never runs while hovering a row (nested or not).
  // That's what makes it double as the "drag a file out of its folder, back to root"
  // target: leaving every folder's contents still means leaving this section's rows.
  function handleRootDragOver(event: DragEvent<HTMLElement>) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    updateDragOverTarget({ id: ROOT_DROP_ID, zone: 'into' })
  }

  function handleRootDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault()
    const draggedProjectId = event.dataTransfer.getData('text/plain')
    // See the comment on ProjectItem's handleDrop — clear here rather than waiting on
    // the dragged row's own `dragend`, which can get lost if the move unmounts it.
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
            className="group/create flex h-11.5 w-full cursor-pointer items-center justify-center gap-2.5 rounded-[5px] border-0 bg-[#1e55c5] text-[16px] font-bold tracking-[0.16px] text-white transition-colors hover:bg-[#1a49aa]"
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
            onSelect={() => {
              onSearchChange('')
              setIsCreatingFolder(true)
            }}
          >
            <FolderPlus size={16} />
            Create folder
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <label className="mt-4 mb-5.25 flex h-10.5 items-center justify-between rounded-lg border border-[#e9ebf0] px-2.5 text-[#6e7180]">
        <span className="sr-only">Search forms</span>
        <input
          className="min-w-0 flex-1 border-0 bg-transparent text-[14px] font-medium text-[#3f4045] outline-0 placeholder:text-[#6e7180] placeholder:opacity-100"
          type="search"
          placeholder="Search forms..."
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <Search size={24} />
      </label>

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
        {visibleProjects.length > 0 ? (
          visibleProjects.map((project, index) => (
            <ProjectItem
              item={project}
              key={project.id}
              parentFolderId={null}
              siblings={visibleProjects}
              index={index}
              openFolderIds={openFolderIds}
              searchTerm={searchTerm}
              selectedProjectId={selectedProjectId}
              draggedId={draggedId}
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
          <p className="m-0 p-2.5 text-[14px] font-medium tracking-[0.14px] text-[#6e7180]">
            No forms found
          </p>
        )}
      </div>
    </section>
  )
}

function UserProfile({ user }: { user: SidebarUser }) {
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
      <Button
        className="size-10 text-[#3f4045]"
        aria-label="Profile options"
        size="icon"
        variant="ghost"
      >
        <MoreHorizontal className="size-6" />
      </Button>
    </div>
  )
}

export function Sidebar({
  brand,
  isCollapsed,
  openFolderIds,
  projects,
  searchTerm,
  selectedProjectId,
  user,
  onCreateFolder,
  onCreateForm,
  onGoFiles,
  onGoHome,
  onMoveProject,
  onSearchChange,
  onSelectProject,
  onToggleCollapse,
  onToggleFolder,
}: SidebarProps) {
  if (isCollapsed) {
    return null
  }

  return (
    <aside
      className={cn(
        'sticky top-0 z-30 flex h-screen shrink-0 flex-col border-r-2 border-[#e8eaf1] bg-white transition-[width,flex-basis] duration-200 ease-in-out',
        'max-[900px]:fixed max-[900px]:inset-y-0 max-[900px]:left-0 max-[900px]:z-40 max-[900px]:h-dvh max-[900px]:border-b-0 max-[900px]:shadow-2xl',
        'w-78.25 basis-78.25 max-[1200px]:w-71.5 max-[1200px]:basis-71.5 max-[900px]:w-[min(313px,calc(100vw_-_24px))] max-[900px]:basis-auto',
      )}
      aria-label="Primary navigation"
    >
      <SidebarHeader
        brand={brand}
        onToggleCollapse={onToggleCollapse}
      />
      <HomeNav
        isCollapsed={isCollapsed}
        onGoFiles={onGoFiles}
        onGoHome={onGoHome}
      />
      {!isCollapsed ? (
        <>
          <ProjectNavigation
            projects={projects}
            openFolderIds={openFolderIds}
            searchTerm={searchTerm}
            selectedProjectId={selectedProjectId}
            onCreateFolder={onCreateFolder}
            onCreateForm={onCreateForm}
            onMoveProject={onMoveProject}
            onSearchChange={onSearchChange}
            onSelectProject={onSelectProject}
            onToggleFolder={onToggleFolder}
          />
          <UserProfile user={user} />
        </>
      ) : null}
    </aside>
  )
}
