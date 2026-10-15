import { apiDelete, apiGet, apiPatch, apiPost } from '../lib/api'
import { asUtcIso } from '../lib/apiTimestamp'

/** Row shape returned by `GET /api/folders` (see gnp-server folderService.listByAdmin). */
export type ApiFolder = {
  id: number
  /** null at the top level. */
  parentFolderId: number | null
  folderName: string | null
  folderDescription: string | null
  sortOrder: number
  createdAt: string | null
  updatedAt: string | null
  formCount: number
}

export type CreateFolderPayload = {
  folderName: string
  folderDescription?: string
  parentFolderId?: number | null
}

export type UpdateFolderPayload = {
  folderName?: string
  folderDescription?: string
  /** Moves the folder; null = top level. */
  parentFolderId?: number | null
}

export async function listFolders(): Promise<ApiFolder[]> {
  const folders = await apiGet<ApiFolder[]>('/folders')
  // DB timestamps → strict ISO, so "date modified/created" sorts use the right instant.
  return folders.map((folder) => ({
    ...folder,
    createdAt: asUtcIso(folder.createdAt),
    updatedAt: asUtcIso(folder.updatedAt),
  }))
}

export function createFolder(payload: CreateFolderPayload): Promise<{ id: number }> {
  return apiPost<{ id: number }>('/folders', payload)
}

export function updateFolder(id: number, payload: UpdateFolderPayload): Promise<{ id: number }> {
  return apiPatch<{ id: number }>(`/folders/${id}`, payload)
}

export function deleteFolder(id: number): Promise<null> {
  return apiDelete<null>(`/folders/${id}`)
}

/** folderIds must be exactly the folders inside `parentFolderId` (null = top level). */
export function reorderFolders(payload: {
  parentFolderId: number | null
  folderIds: number[]
}): Promise<null> {
  return apiPatch<null>('/folders/reorder', payload)
}
