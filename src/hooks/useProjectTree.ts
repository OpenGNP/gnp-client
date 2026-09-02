import { useState } from 'react'

import type { ProjectTreeItem } from '../data/dashboard'
import {
  addProjectToFolder,
  addProjectToRoot,
  findProjectById,
  getDefaultOpenFolderIds,
  isIdWithinItem,
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
      const moved = findProjectById(currentProjects, projectId)

      if (!moved) {
        return currentProjects
      }

      // A folder can't be dropped into itself or one of its own descendants.
      if (moved.type === 'folder' && folderId && isIdWithinItem(moved, folderId)) {
        return currentProjects
      }

      const result = removeProjectById(currentProjects, projectId)

      if (!result.removedProject) {
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

  function addFolder(name: string, parentFolderId: string | null = null) {
    const label = name.trim()

    if (!label) {
      return
    }

    const newFolder: ProjectTreeItem = {
      id: crypto.randomUUID(),
      label,
      type: 'folder',
    }

    setProjects((currentProjects) =>
      parentFolderId
        ? addProjectToFolder(currentProjects, parentFolderId, newFolder)
        : [newFolder, ...currentProjects],
    )

    if (parentFolderId) {
      setOpenFolderIds((currentFolderIds) => {
        const nextFolderIds = new Set(currentFolderIds)
        nextFolderIds.add(parentFolderId)
        return nextFolderIds
      })
    }
  }

  return {
    projects,
    openFolderIds,
    addProject,
    addFolder,
    moveProject,
    toggleFolder,
  }
}
