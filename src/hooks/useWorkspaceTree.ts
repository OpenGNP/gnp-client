import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'

import type { ApiFolder } from '../api/folders'
import type { ApiForm } from '../api/forms'
import { foldersQuery, formRefQuery, formsQuery } from '../api/queries'
import type { ProjectTreeItem } from '../data/dashboard'
import { formNodeId } from '../utils/projectTree'

type WorkspaceTree = {
  projects: ProjectTreeItem[]
  status: 'loading' | 'ready' | 'error'
  /** Refetches whichever of the two lists failed. */
  retry: () => void
}

const EMPTY: ProjectTreeItem[] = []

/**
 * Builds the sidebar project tree from the real API: top-level folders (flat — the
 * backend has no folder nesting yet) each holding their forms, then any folder-less
 * forms at the root. The local add/rename/move edits in `useProjectTree` are applied
 * optimistically and persisted by App's handlers; those mark these queries stale
 * without refetching (see markWorkspaceStale), so the tree isn't re-seeded under them.
 *
 * `GET /forms`/`GET /folders` are also used elsewhere for recency order (Home's
 * "Recent forms"), so their own ordering is left alone — sorting by `sortOrder` for
 * the tree happens here, client-side, rather than changing what the endpoints return.
 */
export function useWorkspaceTree(): WorkspaceTree {
  // Shared with Home's "Recent forms" (same `['forms']` query), so opening Home
  // doesn't fetch the list twice, and a Home edit written to that cache shows up
  // in the sidebar too.
  const foldersResult = useQuery(foldersQuery())
  const formsResult = useQuery(formsQuery())
  const folders = foldersResult.data
  const forms = formsResult.data

  // Seed each form's URL → id lookup (useRouteForm), so opening a form from the app
  // doesn't wait on a resolve request before its own data can load.
  const queryClient = useQueryClient()
  useEffect(() => {
    for (const form of forms ?? []) {
      const { queryKey } = formRefQuery(form.urlId)
      if (!queryClient.getQueryData(queryKey)) {
        queryClient.setQueryData(queryKey, { id: form.id, urlId: form.urlId })
      }
    }
  }, [forms, queryClient])

  // Memoized on the two data references — React Query keeps them stable until the
  // data actually changes, and useProjectTree re-seeds whenever this changes.
  const projects = useMemo(
    () => (folders && forms ? buildTree(folders, forms) : EMPTY),
    [folders, forms],
  )

  const status =
    foldersResult.isError || formsResult.isError
      ? 'error'
      : folders && forms
        ? 'ready'
        : 'loading'

  function retry() {
    if (foldersResult.isError) void foldersResult.refetch()
    if (formsResult.isError) void formsResult.refetch()
  }

  return { projects, status, retry }
}

function buildTree(folders: ApiFolder[], forms: ApiForm[]): ProjectTreeItem[] {
  const sortedForms = forms.slice().sort((a, b) => a.sortOrder - b.sortOrder)
  const sortedFolders = folders.slice().sort((a, b) => a.sortOrder - b.sortOrder)

  const formsByFolder = new Map<number | null, ProjectTreeItem[]>()
  for (const form of sortedForms) {
    const node: ProjectTreeItem = {
      id: formNodeId(form.id),
      label: form.formTitle ?? 'Untitled form',
      type: 'document',
      formId: String(form.id),
      urlId: form.urlId,
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

  return [...folderNodes, ...(formsByFolder.get(null) ?? [])]
}
