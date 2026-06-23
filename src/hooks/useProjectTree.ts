import { useState } from 'react'

import type { ProjectTreeItem } from '../data/dashboard'
import {
  addProjectToFolder,
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

  function moveProject(projectId: string, folderId: string) {
    setProjects((currentProjects) => {
      const result = removeProjectById(currentProjects, projectId)

      if (!result.removedProject || result.removedProject.type === 'folder') {
        return currentProjects
      }

      return addProjectToFolder(result.projects, folderId, result.removedProject)
    })

    setOpenFolderIds((currentFolderIds) => {
      const nextFolderIds = new Set(currentFolderIds)
      nextFolderIds.add(folderId)
      return nextFolderIds
    })
  }

  return {
    projects,
    openFolderIds,
    moveProject,
    toggleFolder,
  }
}
