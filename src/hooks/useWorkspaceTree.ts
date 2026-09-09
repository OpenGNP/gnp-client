import { useEffect, useState } from 'react'

import { listFolders } from '../api/folders'
import { listForms } from '../api/forms'
import type { ProjectTreeItem } from '../data/dashboard'
import { formNodeId } from '../utils/projectTree'

type WorkspaceTree = {
  projects: ProjectTreeItem[]
  status: 'loading' | 'ready' | 'error'
}

const EMPTY: ProjectTreeItem[] = []

/**
 * Builds the sidebar project tree from the real API: top-level folders (flat — the
 * backend has no folder nesting yet) each holding their forms, then any folder-less
 * forms at the root. Fetched once; the local add/rename/move edits in `useProjectTree`
 * stay client-side until a drag persists them via reorderForms/reorderFolders.
 *
 * `GET /forms`/`GET /folders` are also used elsewhere for recency order (Home's
 * "Recent forms"), so their own ordering is left alone — sorting by `sortOrder` for
 * the tree happens here, client-side, rather than changing what the endpoints return.
 */
export function useWorkspaceTree(): WorkspaceTree {
  const [state, setState] = useState<WorkspaceTree>({ projects: EMPTY, status: 'loading' })

  useEffect(() => {
    let cancelled = false

    Promise.all([listFolders(), listForms()])
      .then(([folders, forms]) => {
        if (cancelled) return

        const sortedForms = forms.slice().sort((a, b) => a.sortOrder - b.sortOrder)
        const sortedFolders = folders.slice().sort((a, b) => a.sortOrder - b.sortOrder)

        const formsByFolder = new Map<number | null, ProjectTreeItem[]>()
        for (const form of sortedForms) {
          const node: ProjectTreeItem = {
            id: formNodeId(form.id),
            label: form.formTitle ?? 'Untitled form',
            type: 'document',
            formId: String(form.id),
            updatedAt: form.updatedAt,
            createdAt: form.createdAt,
          }
          const key = form.folderId ?? null
          const bucket = formsByFolder.get(key)
          if (bucket) {
            bucket.push(node)
          } else {
            formsByFolder.set(key, [node])
          }
        }

        const folderNodes: ProjectTreeItem[] = sortedFolders.map((folder) => ({
          id: String(folder.id),
          label: folder.folderName ?? 'Untitled folder',
          type: 'folder',
          // Feeds the Files page's "Date modified" sort. `updatedAt` bumps on rename;
          // `createdAt` is the fallback for folders never renamed.
          updatedAt: folder.updatedAt,
          createdAt: folder.createdAt,
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
