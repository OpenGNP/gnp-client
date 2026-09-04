import { apiDelete, apiGet } from '../lib/api'

/** Row shape returned by `GET /api/forms` (see gnp-server formService.listByAdmin). */
export type ApiForm = {
  id: number
  formTitle: string | null
  formDescription: string | null
  status: string | null
  accessType: string | null
  folderId: number | null
  startDate: string | null
  endDate: string | null
  createdAt: string | null
  submissionCount: number
}

export function listForms(folderId?: number): Promise<ApiForm[]> {
  return apiGet<ApiForm[]>('/forms', {
    params: folderId === undefined ? undefined : { folderId },
  })
}

export function deleteForm(id: number): Promise<null> {
  return apiDelete<null>(`/forms/${id}`)
}
