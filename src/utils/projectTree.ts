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

  return decodeURIComponent(pathname.replace('/forms/', ''))
}

export function removeProjectById(
  projects: ProjectTreeItem[],
  id: string,
): { projects: ProjectTreeItem[]; removedProject: ProjectTreeItem | null } {
  let removedProject: ProjectTreeItem | null = null

  const nextProjects = projects.reduce<ProjectTreeItem[]>((items, project) => {
    if (project.id === id) {
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
