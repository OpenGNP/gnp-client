import type { ProjectTreeItem } from '../data/dashboard'

/**
 * Tree-node id for a form. Deliberately NOT the bare DB id: form ids and folder ids
 * are independent DB sequences, so a form and a folder can share a number. The tree
 * (and `findProjectById`, which checks folders first) needs node ids unique across
 * both. The real numeric id still rides along on the node's `formId` for routing/API.
 */
export function formNodeId(dbId: string | number): string {
  return `form-${dbId}`
}

export function getDefaultOpenFolderIds(projects: ProjectTreeItem[]) {
  const folderIds = new Set<string>()

  for (const project of projects) {
    if (project.type === 'folder' && project.open) {
      folderIds.add(project.id)
    }

    if (project.children) {
      getDefaultOpenFolderIds(project.children).forEach((id) =>
        folderIds.add(id),
      )
    }
  }

  return folderIds
}

/**
 * The sidebar node id for the form a `/forms/:ref` URL points at. `ref` is normally
 * the form's urlId; a legacy numeric id (about to be redirected) maps directly.
 */
export function formNodeIdForRef(projects: ProjectTreeItem[], ref: string): string {
  const find = (items: ProjectTreeItem[]): ProjectTreeItem | undefined => {
    for (const item of items) {
      if (item.type === 'document' && item.urlId === ref) return item
      const found = item.children ? find(item.children) : undefined
      if (found) return found
    }
    return undefined
  }
  return find(projects)?.id ?? formNodeId(ref)
}

export function getSelectedProjectId(pathname: string) {
  // A form route selects the form; a folder route selects that folder.
  for (const prefix of ['/forms/', '/files/']) {
    if (pathname.startsWith(prefix)) {
      const [projectId] = pathname.slice(prefix.length).split('/')
      return decodeURIComponent(projectId ?? '')
    }
  }

  return ''
}

export function removeProjectById(
  projects: ProjectTreeItem[],
  id: string,
): { projects: ProjectTreeItem[]; removedProject: ProjectTreeItem | null } {
  let removedProject: ProjectTreeItem | null = null

  const nextProjects = projects.reduce<ProjectTreeItem[]>((items, project) => {
    if (project.id === id || project.formId === id) {
      removedProject = project
      return items
    }

    if (project.children) {
      const result = removeProjectById(project.children, id)

      if (result.removedProject) {
        removedProject = result.removedProject
      }

      items.push({
        ...project,
        children: result.projects,
      })
      return items
    }

    items.push(project)
    return items
  }, [])

  return { projects: nextProjects, removedProject }
}

export function findProjectById(
  projects: ProjectTreeItem[],
  id: string,
): ProjectTreeItem | null {
  for (const project of projects) {
    if (project.id === id || project.formId === id) {
      return project
    }

    if (project.children) {
      const found = findProjectById(project.children, id)
      if (found) {
        return found
      }
    }
  }

  return null
}

export function isIdWithinItem(item: ProjectTreeItem, id: string): boolean {
  if (item.id === id) {
    return true
  }

  return (item.children ?? []).some((child) => isIdWithinItem(child, id))
}

// The chain of folders from the root down to `folderId` (inclusive).
// Empty when the id doesn't resolve to a folder — callers treat that as "root".
export function getFolderPath(
  projects: ProjectTreeItem[],
  folderId: string,
): ProjectTreeItem[] {
  for (const project of projects) {
    if (project.type !== 'folder') {
      continue
    }

    if (project.id === folderId) {
      return [project]
    }

    if (project.children) {
      const childPath = getFolderPath(project.children, folderId)
      if (childPath.length > 0) {
        return [project, ...childPath]
      }
    }
  }

  return []
}

export function findFolderById(
  projects: ProjectTreeItem[],
  id: string,
): ProjectTreeItem | null {
  for (const project of projects) {
    if (project.id === id && project.type === 'folder') {
      return project
    }

    if (project.children) {
      const found = findFolderById(project.children, id)
      if (found) {
        return found
      }
    }
  }

  return null
}

// --- Duplicate-name handling (Files page / sidebar create + rename) ----------

type NameScope = {
  /** Container to check within — a folder node id, or `null` for the root. */
  parentFolderId: string | null
  type: ProjectTreeItem['type']
  /** Ignore this item (renaming something to a variant of its own name). */
  exceptId?: string
}

function siblingsInScope(projects: ProjectTreeItem[], scope: NameScope): ProjectTreeItem[] {
  const container = scope.parentFolderId
    ? (findFolderById(projects, scope.parentFolderId)?.children ?? [])
    : projects
  return container.filter((item) => item.type === scope.type && item.id !== scope.exceptId)
}

/** True if a same-type sibling in the same container already has this name (case-insensitive). */
export function isNameTaken(projects: ProjectTreeItem[], name: string, scope: NameScope): boolean {
  const target = name.trim().toLowerCase()
  return siblingsInScope(projects, scope).some(
    (item) => item.label.trim().toLowerCase() === target,
  )
}

/** `name` if free, else the first free `name (2)`, `name (3)`, … (used on create). */
export function uniqueName(projects: ProjectTreeItem[], name: string, scope: NameScope): string {
  const base = name.trim()
  if (!isNameTaken(projects, base, scope)) return base
  for (let n = 2; ; n += 1) {
    const candidate = `${base} (${n})`
    if (!isNameTaken(projects, candidate, scope)) return candidate
  }
}

// `beforeId` inserts `projectToAdd` just before the sibling with that id (used for
// drag-to-reorder); omitted, or an id no longer present among these siblings, appends
// at the end — the existing "just add it" behavior every other caller relies on.
export function addProjectToRoot(
  projects: ProjectTreeItem[],
  projectToAdd: ProjectTreeItem,
  beforeId?: string | null,
): ProjectTreeItem[] {
  const index = beforeId ? projects.findIndex((project) => project.id === beforeId) : -1

  if (index === -1) {
    return [...projects, projectToAdd]
  }

  const next = projects.slice()
  next.splice(index, 0, projectToAdd)
  return next
}

/** Which folder (by id) directly contains `id`, or `null` if it's not nested — including when `id` isn't found at all. */
export function findParentFolderId(projects: ProjectTreeItem[], id: string): string | null {
  function locate(items: ProjectTreeItem[], parentId: string | null): { found: true; parentId: string | null } | { found: false } {
    for (const item of items) {
      if (item.id === id || item.formId === id) {
        return { found: true, parentId }
      }
    }

    for (const item of items) {
      if (item.children) {
        const result = locate(item.children, item.id)
        if (result.found) {
          return result
        }
      }
    }

    return { found: false }
  }

  const result = locate(projects, null)
  return result.found ? result.parentId : null
}

export function renameProjectById(
  projects: ProjectTreeItem[],
  id: string,
  label: string,
): ProjectTreeItem[] {
  return projects.map((project) => {
    if (project.id === id) {
      return { ...project, label }
    }

    if (project.children) {
      return {
        ...project,
        children: renameProjectById(project.children, id, label),
      }
    }

    return project
  })
}

export function addProjectToFolder(
  projects: ProjectTreeItem[],
  folderId: string,
  projectToAdd: ProjectTreeItem,
  beforeId?: string | null,
): ProjectTreeItem[] {
  return projects.map((project) => {
    if (project.id === folderId && project.type === 'folder') {
      return {
        ...project,
        children: addProjectToRoot(project.children ?? [], projectToAdd, beforeId),
      }
    }

    if (project.children) {
      return {
        ...project,
        children: addProjectToFolder(project.children, folderId, projectToAdd, beforeId),
      }
    }

    return project
  })
}

/**
 * Ids of every folder that contains `nodeId` (outermost first), or [] at root /
 * not found. Used to auto-expand the sidebar down to the current item.
 */
export function getAncestorFolderIds(projects: ProjectTreeItem[], nodeId: string): string[] {
  for (const project of projects) {
    if (project.id === nodeId) {
      return []
    }
    if (project.type === 'folder' && project.children) {
      const inner = getAncestorFolderIds(project.children, nodeId)
      if (inner.length > 0 || project.children.some((child) => child.id === nodeId)) {
        return [project.id, ...inner]
      }
    }
  }
  return []
}

/** Everything inside a folder, at any depth — what deleting it takes with it. */
export function folderContents(item: ProjectTreeItem): { forms: ProjectTreeItem[]; folders: number } {
  const forms: ProjectTreeItem[] = []
  let folders = 0
  const walk = (children: ProjectTreeItem[] = []) => {
    for (const child of children) {
      if (child.type === 'folder') {
        folders += 1
        walk(child.children)
      } else {
        forms.push(child)
      }
    }
  }
  walk(item.children)
  return { forms, folders }
}
