import { useEffect, useState } from 'react'

import { listFolders } from '../api/folders'
import { listForms } from '../api/forms'
import type { ProjectTreeItem } from '../data/dashboard'

type WorkspaceTree = {
  projects: ProjectTreeItem[]
  status: 'loading' | 'ready' | 'error'
}

const EMPTY: ProjectTreeItem[] = []

/**
 * Builds the sidebar project tree from the real API: top-level folders (flat — the
 * backend has no folder nesting yet) each holding their forms, then any folder-less
 * forms at the root. Fetched once; the local add/rename/move edits in `useProjectTree`
 * stay client-side for now.
 */
export function useWorkspaceTree(): WorkspaceTree {
  const [state, setState] = useState<WorkspaceTree>({ projects: EMPTY, status: 'loading' })

  useEffect(() => {
    let cancelled = false

    Promise.all([listFolders(), listForms()])
      .then(([folders, forms]) => {
        if (cancelled) return

        const formsByFolder = new Map<number | null, ProjectTreeItem[]>()
        for (const form of forms) {
          const node: ProjectTreeItem = {
            id: String(form.id),
            label: form.formTitle ?? 'Untitled form',
            type: 'document',
            formId: String(form.id),
          }
          const key = form.folderId ?? null
          const bucket = formsByFolder.get(key)
          if (bucket) {
            bucket.push(node)
          } else {
            formsByFolder.set(key, [node])
          }
        }

        const folderNodes: ProjectTreeItem[] = folders.map((folder) => ({
          id: String(folder.id),
          label: folder.folderName ?? 'Untitled folder',
          type: 'folder',
          children: formsByFolder.get(folder.id) ?? [],
        }))

        setState({
          projects: [...folderNodes, ...(formsByFolder.get(null) ?? [])],
          status: 'ready',
        })
      })
      .catch(() => {
        if (!cancelled) {
          setState({ projects: EMPTY, status: 'error' })
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
