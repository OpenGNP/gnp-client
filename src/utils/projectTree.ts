import type { ProjectTreeItem } from '../data/dashboard'

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

export function getSelectedProjectId(pathname: string) {
  if (!pathname.startsWith('/forms/')) {
    return ''
  }

  const [projectId] = pathname.replace('/forms/', '').split('/')
  return decodeURIComponent(projectId ?? '')
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

export function addProjectToRoot(
  projects: ProjectTreeItem[],
  projectToAdd: ProjectTreeItem,
): ProjectTreeItem[] {
  return [...projects, projectToAdd]
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
): ProjectTreeItem[] {
  return projects.map((project) => {
    if (project.id === folderId && project.type === 'folder') {
      return {
        ...project,
        children: [...(project.children ?? []), projectToAdd],
      }
    }

    if (project.children) {
      return {
        ...project,
        children: addProjectToFolder(project.children, folderId, projectToAdd),
      }
    }

    return project
  })
}
