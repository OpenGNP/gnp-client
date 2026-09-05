import { useEffect, useRef, useState } from 'react'

import type { ProjectTreeItem } from '../data/dashboard'
import {
  addProjectToFolder,
  addProjectToRoot,
  findProjectById,
  getDefaultOpenFolderIds,
  isIdWithinItem,
  removeProjectById,
  renameProjectById,
} from '../utils/projectTree'

export function useProjectTree(initialProjects: ProjectTreeItem[]) {
  const [projects, setProjects] = useState(initialProjects)
  const [openFolderIds, setOpenFolderIds] = useState(() =>
    getDefaultOpenFolderIds(initialProjects),
  )

  // `initialProjects` is a fixed seed today, but the workspace tree now arrives
  // asynchronously from the API. Re-seed when that reference actually changes so the
  // real folders/forms replace the empty placeholder once loaded.
  const seededProjectsRef = useRef(initialProjects)
  useEffect(() => {
    if (seededProjectsRef.current === initialProjects) {
      return
    }
    seededProjectsRef.current = initialProjects
    setProjects(initialProjects)
    setOpenFolderIds(getDefaultOpenFolderIds(initialProjects))
  }, [initialProjects])

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

  function removeProject(projectId: string) {
    setProjects((currentProjects) => removeProjectById(currentProjects, projectId).projects)
  }

  function renameProject(projectId: string, label: string) {
    const trimmed = label.trim()

    if (!trimmed) {
      return
    }

    setProjects((currentProjects) =>
      renameProjectById(currentProjects, projectId, trimmed),
    )
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

  // Takes a ready-made node (caller already has its real, API-assigned id) rather than
  // a name — folder creation is now async (POST /folders happens first), so there's no
  // synchronous id to generate here the way there used to be. Root folders are
  // prepended, not appended: the Sidebar's inline "new folder" input renders at the top
  // of the list, and this keeps the real folder swapping in at that same spot instead
  // of jumping to the bottom once the request resolves.
  function addFolder(folder: ProjectTreeItem, parentFolderId: string | null = null) {
    setProjects((currentProjects) =>
      parentFolderId
        ? addProjectToFolder(currentProjects, parentFolderId, folder)
        : [folder, ...currentProjects],
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
    setProjects,
    openFolderIds,
    addProject,
    addFolder,
    moveProject,
    removeProject,
    renameProject,
    toggleFolder,
  }
}
