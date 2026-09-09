import { apiDelete, apiGet, apiPatch, apiPost } from '../lib/api'

/** Row shape returned by `GET /api/folders` (see gnp-server folderService.listByAdmin). */
export type ApiFolder = {
  id: number
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
}

export type UpdateFolderPayload = {
  folderName?: string
  folderDescription?: string
}

export function listFolders(): Promise<ApiFolder[]> {
  return apiGet<ApiFolder[]>('/folders')
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

/** folderIds must be the exact set of folders you currently have. */
export function reorderFolders(payload: { folderIds: number[] }): Promise<null> {
  return apiPatch<null>('/folders/reorder', payload)
}
