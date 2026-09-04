import { apiGet } from '../lib/api'

/** Row shape returned by `GET /api/folders` (see gnp-server folderService.listByAdmin). */
export type ApiFolder = {
  id: number
  folderName: string | null
  folderDescription: string | null
  createdAt: string | null
  formCount: number
}

export function listFolders(): Promise<ApiFolder[]> {
  return apiGet<ApiFolder[]>('/folders')
}
