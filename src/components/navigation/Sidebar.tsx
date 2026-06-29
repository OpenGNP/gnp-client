import {
  ChevronLeft,
  FileText,
  Folder,
  FolderOpen,
  Home,
  MoreHorizontal,
  PlusCircle,
  Search,
  Smile,
} from 'lucide-react'
import type { DragEvent } from 'react'
import { Collapsible } from 'radix-ui'

import type { ProjectTreeItem } from '../../data/dashboard'
import { cn } from '../../lib/utils'

type SidebarUser = {
  name: string
  email: string
}

type SidebarBrand = {
  logo: string
  name: string
}

export type SidebarProps = {
  brand: SidebarBrand
  user: SidebarUser
  projects: ProjectTreeItem[]
  isCollapsed: boolean
  openFolderIds: Set<string>
  searchTerm: string
  selectedProjectId: string
  onGoHome: () => void
  onMoveProject: (projectId: string, folderId: string) => void
  onSearchChange: (value: string) => void
  onSelectProject: (item: ProjectTreeItem) => void
  onToggleCollapse: () => void
  onToggleFolder: (id: string) => void
}

type ProjectItemProps = {
  item: ProjectTreeItem
  isCollapsed?: boolean
  openFolderIds: Set<string>
  searchTerm: string
  selectedProjectId: string
  onSelectProject: (item: ProjectTreeItem) => void
  onMoveProject: (projectId: string, folderId: string) => void
  onToggleFolder: (id: string) => void
}

const iconButtonClass =
  'inline-flex size-10 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-[#3f4045] transition-colors hover:bg-[#f7f8fb] focus-visible:ring-2 focus-visible:ring-[#1e55c5]/40 focus-visible:outline-none'

const navButtonClass =
  'flex h-[46px] w-full cursor-pointer items-center gap-2.5 border-0 bg-transparent text-left text-[16px] font-bold tracking-[0.16px] text-[#3f4045]'

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
      <button
        className={iconButtonClass}
        aria-label="Collapse sidebar"
        onClick={onToggleCollapse}
        type="button"
      >
        <ChevronLeft size={26} strokeWidth={2.4} />
      </button>
    </div>
  )
}

function HomeNav({
  isCollapsed,
  onGoHome,
}: {
  isCollapsed: boolean
  onGoHome: () => void
}) {
  return (
    <nav
      className={cn('border-y border-[#e8eaf1] py-2', isCollapsed && 'px-3')}
      aria-label="Main"
    >
      <button
        className={cn(navButtonClass, 'px-6.5 py-0', isCollapsed && 'justify-center px-0')}
        onClick={onGoHome}
        type="button"
      >
        <Home size={26} strokeWidth={2.1} />
        {!isCollapsed ? <span>Home</span> : null}
      </button>
    </nav>
  )
}

function ProjectItem({
  item,
  isCollapsed = false,
  openFolderIds,
  searchTerm,
  selectedProjectId,
  onSelectProject,
  onMoveProject,
  onToggleFolder,
}: ProjectItemProps) {
  const isFolder = item.type === 'folder'
  const isOpen = isFolder && (openFolderIds.has(item.id) || searchTerm.trim())
  const isSelected = item.id === selectedProjectId
  const Icon = isFolder ? (isOpen ? FolderOpen : Folder) : FileText

  function handleSelect() {
    onSelectProject(item)
  }

  function handleDragStart(event: DragEvent<HTMLButtonElement>) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', item.id)
  }

  function handleDragOver(event: DragEvent<HTMLButtonElement>) {
    if (!isFolder) {
      return
    }

    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    if (!isFolder) {
      return
    }

    event.preventDefault()
    const draggedProjectId = event.dataTransfer.getData('text/plain')

    if (!draggedProjectId || draggedProjectId === item.id) {
      return
    }

    onMoveProject(draggedProjectId, item.id)
  }

  const itemButton = (
    <button
      className={cn(
        treeButtonClass,
        treeTextClass,
        isOpen && 'text-[#1e55c5]',
        isSelected && 'bg-[#f7f8fb] text-[#1e55c5]',
        isFolder && 'data-[drop-target=true]:ring-2 data-[drop-target=true]:ring-[#1e55c5]/30',
        !isFolder && 'cursor-grab active:cursor-grabbing',
      )}
      type="button"
      aria-pressed={!isFolder ? isSelected : undefined}
      draggable={!isFolder}
      title={isCollapsed ? item.label : undefined}
      onDragOver={handleDragOver}
      onDragStart={!isFolder ? handleDragStart : undefined}
      onDrop={handleDrop}
      onClick={isFolder ? undefined : handleSelect}
    >
      <Icon size={isFolder ? 24 : 22} />
      <span>{item.label}</span>
    </button>
  )

  if (isFolder) {
    return (
      <Collapsible.Root
        open={Boolean(isOpen)}
        onOpenChange={() => onToggleFolder(item.id)}
      >
        <Collapsible.Trigger asChild>{itemButton}</Collapsible.Trigger>
        {item.children && item.children.length > 0 ? (
          <Collapsible.Content className="ml-8 w-[calc(100%-32px)]">
            {item.children.map((child) => (
              <ProjectItem
                item={child}
                key={child.id}
                isCollapsed={isCollapsed}
                openFolderIds={openFolderIds}
                searchTerm={searchTerm}
                selectedProjectId={selectedProjectId}
                onMoveProject={onMoveProject}
                onSelectProject={onSelectProject}
                onToggleFolder={onToggleFolder}
              />
            ))}
          </Collapsible.Content>
        ) : null}
      </Collapsible.Root>
    )
  }

  return itemButton
}

function ProjectNavigation({
  projects,
  openFolderIds,
  searchTerm,
  selectedProjectId,
  onSearchChange,
  onSelectProject,
  onMoveProject,
  onToggleFolder,
}: Omit<
  SidebarProps,
  'brand' | 'user' | 'isCollapsed' | 'onGoHome' | 'onToggleCollapse'
>) {
  const visibleProjects = filterProjects(projects, searchTerm)

  return (
    <section
      className="min-h-0 flex-1 overflow-y-auto px-5 pt-5.75 pb-6 max-[900px]:pb-4"
      aria-labelledby="project-nav-title"
    >
      <h2
        className="mt-0 mr-0 mb-3.25 ml-0.75 text-[14px] leading-5.5 font-medium tracking-[0.14px] text-black"
        id="project-nav-title"
      >
        Your Project
      </h2>
      <button className="flex h-11.5 w-full cursor-pointer items-center justify-center gap-2.5 rounded-[5px] border-0 bg-[#1e55c5] text-[16px] font-bold tracking-[0.16px] text-white">
        <PlusCircle size={21} />
        <span>Create Form</span>
      </button>
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
        {visibleProjects.length > 0 ? (
          visibleProjects.map((project) => (
            <ProjectItem
              item={project}
              key={project.id}
              openFolderIds={openFolderIds}
              searchTerm={searchTerm}
              selectedProjectId={selectedProjectId}
              onMoveProject={onMoveProject}
              onSelectProject={onSelectProject}
              onToggleFolder={onToggleFolder}
            />
          ))
        ) : (
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
      <button className={iconButtonClass} aria-label="Profile options">
        <MoreHorizontal size={24} />
      </button>
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
        'w-78.25 basis-78.25 max-[1200px]:w-71.5 max-[1200px]:basis-71.5 max-[900px]:w-[min(313px,calc(100vw-24px))] max-[900px]:basis-auto',
      )}
      aria-label="Primary navigation"
    >
      <SidebarHeader
        brand={brand}
        onToggleCollapse={onToggleCollapse}
      />
      <HomeNav isCollapsed={isCollapsed} onGoHome={onGoHome} />
      {!isCollapsed ? (
        <>
          <ProjectNavigation
            projects={projects}
            openFolderIds={openFolderIds}
            searchTerm={searchTerm}
            selectedProjectId={selectedProjectId}
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
