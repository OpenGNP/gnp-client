import { useState } from 'react'

import type { ProjectTreeItem } from '../data/dashboard'
import {
  addProjectToFolder,
  addProjectToRoot,
  getDefaultOpenFolderIds,
  removeProjectById,
} from '../utils/projectTree'

export function useProjectTree(initialProjects: ProjectTreeItem[]) {
  const [projects, setProjects] = useState(initialProjects)
  const [openFolderIds, setOpenFolderIds] = useState(() =>
    getDefaultOpenFolderIds(initialProjects),
  )

  function toggleFolder(id: string) {
    setOpenFolderIds((currentFolderIds) => {
      const nextFolderIds = new Set(currentFolderIds)

      if (nextFolderIds.has(id)) {
        nextFolderIds.delete(id)
      } else {
        nextFolderIds.add(id)
      }

      return nextFolderIds
    })
  }

  function moveProject(projectId: string, folderId: string | null) {
    setProjects((currentProjects) => {
      const result = removeProjectById(currentProjects, projectId)

      if (!result.removedProject || result.removedProject.type === 'folder') {
        return currentProjects
      }

      return folderId
        ? addProjectToFolder(result.projects, folderId, result.removedProject)
        : addProjectToRoot(result.projects, result.removedProject)
    })

    if (folderId) {
      setOpenFolderIds((currentFolderIds) => {
        const nextFolderIds = new Set(currentFolderIds)
        nextFolderIds.add(folderId)
        return nextFolderIds
      })
    }
  }

  function addProject(folderId: string | null, projectToAdd: ProjectTreeItem) {
    setProjects((currentProjects) =>
      folderId
        ? addProjectToFolder(currentProjects, folderId, projectToAdd)
        : addProjectToRoot(currentProjects, projectToAdd),
    )

    if (folderId) {
      setOpenFolderIds((currentFolderIds) => {
        const nextFolderIds = new Set(currentFolderIds)
        nextFolderIds.add(folderId)
        return nextFolderIds
      })
    }
  }

  return {
    projects,
    openFolderIds,
    addProject,
    moveProject,
    toggleFolder,
  }
}
