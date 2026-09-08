import { apiDelete, apiGet, apiPatch, apiPost } from '../lib/api'

export type FormStatus = 'draft' | 'active' | 'closed' | 'archived'
export type FormAccessType = 'public' | 'organization' | 'specific'
export type FormFieldType = 'text' | 'textarea' | 'radio' | 'checkbox'
export type FormSection = 'demographic' | 'feedback'

/** Row shape returned by `GET /api/forms` (see gnp-server formService.listByAdmin). */
export type ApiForm = {
  id: number
  formTitle: string | null
  formDescription: string | null
  status: string | null
  accessType: string | null
  folderId: number | null
  sortOrder: number
  startDate: string | null
  endDate: string | null
  createdAt: string | null
  updatedAt: string | null
  submissionCount: number
}

export type ApiFieldOption = {
  id: number
  fieldId: number
  optionLabel: string | null
  optionValue: string | null
  optionOrder: number | null
}

export type ApiFormField = {
  id: number
  formId: number
  fieldLabel: string | null
  fieldType: FormFieldType | null
  section: FormSection | null
  analyzeWithAi: boolean
  allowOther: boolean
  isRequired: boolean | null
  fieldOrder: number | null
  fieldOptions: ApiFieldOption[]
}

export type ApiFormAllowedUser = {
  formId: number
  userId: number
  user: { id: number; fullName: string | null; email: string }
}

/** Shape returned by `GET /api/forms/:id` (see gnp-server formService.getForEdit). */
export type ApiFormDetail = {
  id: number
  adminId: number
  folderId: number | null
  organizationId: number | null
  formTitle: string | null
  formDescription: string | null
  coverImageUrl: string | null
  status: string | null
  accessType: string | null
  acceptingResponses: boolean
  recordName: boolean | null
  oneResponsePerPerson: boolean | null
  startDate: string | null
  endDate: string | null
  createdAt: string | null
  updatedAt: string | null
  formFields: ApiFormField[]
  formAllowedUsers: ApiFormAllowedUser[]
}

export type FieldOptionPayload = {
  optionLabel: string
  optionValue: string
  optionOrder?: number
}

export type FormFieldPayload = {
  fieldLabel: string
  fieldType: FormFieldType
  section: FormSection
  isRequired: boolean
  analyzeWithAi: boolean
  allowOther: boolean
  fieldOrder?: number
  options?: FieldOptionPayload[]
}

export type CreateFormPayload = {
  folderId?: number
  formTitle: string
  formDescription?: string
  status?: FormStatus
  accessType?: FormAccessType
  acceptingResponses?: boolean
  recordName?: boolean
  oneResponsePerPerson?: boolean
  startDate?: string
  endDate?: string
  fields: FormFieldPayload[]
  allowedEmails?: string[]
}

export type UpdateFormPayload = {
  folderId?: number | null
  formTitle?: string
  formDescription?: string
  status?: FormStatus
  accessType?: FormAccessType
  acceptingResponses?: boolean
  recordName?: boolean
  oneResponsePerPerson?: boolean
  // Nullable here (unlike CreateFormPayload) so a save can explicitly clear a
  // previously-set date, not just leave it or set a new one.
  startDate?: string | null
  endDate?: string | null
  fields?: FormFieldPayload[]
  allowedEmails?: string[]
}

export function listForms(folderId?: number): Promise<ApiForm[]> {
  return apiGet<ApiForm[]>('/forms', {
    params: folderId === undefined ? undefined : { folderId },
  })
}

export function getForm(id: number): Promise<ApiFormDetail> {
  return apiGet<ApiFormDetail>(`/forms/${id}`)
}

/** `POST /api/forms` returns the raw inserted row; callers only need its id. */
export function createForm(payload: CreateFormPayload): Promise<{ id: number }> {
  return apiPost<{ id: number }>('/forms', payload)
}

export function updateForm(id: number, payload: UpdateFormPayload): Promise<{ id: number }> {
  return apiPatch<{ id: number }>(`/forms/${id}`, payload)
}

export function deleteForm(id: number): Promise<null> {
  return apiDelete<null>(`/forms/${id}`)
}

export type ReorderFormsPayload = {
  folderId: number | null
  formIds: number[]
}

/** formIds must be the exact set of forms currently in that folder (or, for `folderId: null`, at the root). */
export function reorderForms(payload: ReorderFormsPayload): Promise<null> {
  return apiPatch<null>('/forms/reorder', payload)
}
