import { API_URL, apiDelete, apiGet, apiPatch, apiPost, apiPut } from "../lib/api";
import { asUtcIso } from "../lib/apiTimestamp";
import { getRespondentDeviceId } from "../lib/respondentDevice";

/**
 * Cover images are served through a gated endpoint, never a direct storage URL —
 * `path` is `coverImageUrl` from the server (an internal object key) truthy-checked
 * by the caller, this just builds the URL that actually fetches it. `?v=` busts the
 * browser cache when a cover is replaced (the endpoint's own Cache-Control is a
 * private 5-minute TTL, keyed only by form id).
 */
function coverImageSrc(path: string, updatedAt: string | null): string {
  const version = updatedAt ? `?v=${encodeURIComponent(updatedAt)}` : "";
  return `${API_URL}${path}${version}`;
}

export type FormStatus = "draft" | "active" | "closed" | "archived";
export type FormAccessType = "public" | "organization" | "specific";
export type FormFieldType = "text" | "textarea" | "radio" | "checkbox";
export type FormSection = "demographic" | "feedback";

/** Row shape returned by `GET /api/forms` (see gnp-server formService.listByAdmin). */
export type ApiForm = {
  id: number;
  /** Id for the app's own URLs (`/forms/:urlId`) — unguessable, unlike `id`. */
  urlId: string;
  formTitle: string | null;
  formDescription: string | null;
  status: string | null;
  accessType: string | null;
  folderId: number | null;
  sortOrder: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  /** When I last opened it (editor or dashboard); null if never. */
  lastOpenedAt: string | null;
  submissionCount: number;
};

export type ApiFieldOption = {
  id: number;
  fieldId: number;
  optionLabel: string | null;
  optionValue: string | null;
  optionOrder: number | null;
};

export type ApiFormField = {
  id: number;
  formId: number;
  fieldLabel: string | null;
  fieldType: FormFieldType | null;
  section: FormSection | null;
  analyzeWithAi: boolean;
  allowOther: boolean;
  isRequired: boolean | null;
  fieldOrder: number | null;
  fieldOptions: ApiFieldOption[];
};

/** An invited email on a "specific" form; `userId` is set once that person has an account. */
export type ApiFormAllowedUser = {
  email: string;
  userId: number | null;
};

/** Shape returned by `GET /api/forms/:id` (see gnp-server formService.getForEdit). */
/** How the signed-in user relates to a form: its owner, or someone it was shared with to view. */
export type FormRole = "owner" | "viewer";

export type ApiFormDetail = {
  id: number;
  /** Absent from older servers — treat as "owner". */
  role?: FormRole;
  ownerName?: string | null;
  ownerEmail?: string | null;
  adminId: number;
  folderId: number | null;
  organizationId: number | null;
  formTitle: string | null;
  formDescription: string | null;
  coverImageUrl: string | null;
  status: string | null;
  accessType: string | null;
  acceptingResponses: boolean;
  recordName: boolean | null;
  oneResponsePerPerson: boolean | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  /** Unguessable id for the respondent-facing URL (`/f/:token`), not the sequential form id. */
  publicToken: string;
  /** Id for the app's own URLs (`/forms/:urlId`); separate from publicToken. */
  urlId: string;
  formFields: ApiFormField[];
  formAllowedUsers: ApiFormAllowedUser[];
};

/** Respondent-facing view returned by `GET /api/forms/public/:token` (see gnp-server formService.getPublicByToken). */
export type ApiPublicForm = {
  id: number;
  formTitle: string | null;
  formDescription: string | null;
  coverImageUrl: string | null;
  accessType: string | null;
  acceptingResponses: boolean;
  recordName: boolean | null;
  oneResponsePerPerson: boolean | null;
  // Only meaningful when oneResponsePerPerson is true — false whenever the viewer
  // isn't identifiable (no session), since a fully anonymous visitor can't be deduped.
  alreadyResponded: boolean;
  startDate: string | null;
  endDate: string | null;
  updatedAt: string | null;
  fields: ApiFormField[];
};

export async function getPublicFormByToken(
  token: string,
): Promise<ApiPublicForm> {
  const deviceId = getRespondentDeviceId();
  const form = await apiGet<ApiPublicForm>(
    `/forms/public/${encodeURIComponent(token)}`,
    deviceId ? { params: { deviceId } } : undefined,
  );
  return {
    ...form,
    startDate: asUtcIso(form.startDate),
    endDate: asUtcIso(form.endDate),
    coverImageUrl: form.coverImageUrl
      ? coverImageSrc(`/forms/public/${encodeURIComponent(token)}/cover-image`, form.updatedAt)
      : null,
  };
}

export type FieldOptionPayload = {
  optionLabel: string;
  optionValue: string;
  optionOrder?: number;
};

export type FormFieldPayload = {
  /** Existing question's id when editing — lets the server keep its collected answers. */
  id?: number;
  fieldLabel: string;
  fieldType: FormFieldType;
  section: FormSection;
  isRequired: boolean;
  analyzeWithAi: boolean;
  allowOther: boolean;
  fieldOrder?: number;
  options?: FieldOptionPayload[];
};

export type CreateFormPayload = {
  folderId?: number;
  formTitle: string;
  formDescription?: string;
  status?: FormStatus;
  accessType?: FormAccessType;
  acceptingResponses?: boolean;
  recordName?: boolean;
  oneResponsePerPerson?: boolean;
  startDate?: string;
  endDate?: string;
  fields: FormFieldPayload[];
  allowedEmails?: string[];
};

export type UpdateFormPayload = {
  folderId?: number | null;
  formTitle?: string;
  formDescription?: string;
  status?: FormStatus;
  accessType?: FormAccessType;
  acceptingResponses?: boolean;
  recordName?: boolean;
  oneResponsePerPerson?: boolean;
  // Nullable here (unlike CreateFormPayload) so a save can explicitly clear a
  // previously-set date, not just leave it or set a new one.
  startDate?: string | null;
  endDate?: string | null;
  fields?: FormFieldPayload[];
  allowedEmails?: string[];
};

export async function listForms(folderId?: number): Promise<ApiForm[]> {
  const forms = await apiGet<ApiForm[]>("/forms", {
    params: folderId === undefined ? undefined : { folderId },
  });
  // Normalise the DB timestamps to strict ISO so "last updated" / date sorts use
  // the right instant (see asUtcIso).
  return forms.map((form) => ({
    ...form,
    createdAt: asUtcIso(form.createdAt),
    updatedAt: asUtcIso(form.updatedAt),
    lastOpenedAt: asUtcIso(form.lastOpenedAt),
    startDate: asUtcIso(form.startDate),
    endDate: asUtcIso(form.endDate),
  }));
}

export async function getForm(id: number): Promise<ApiFormDetail> {
  const form = await apiGet<ApiFormDetail>(`/forms/${id}`);
  const updatedAt = asUtcIso(form.updatedAt);
  return {
    ...form,
    createdAt: asUtcIso(form.createdAt),
    updatedAt,
    startDate: asUtcIso(form.startDate),
    endDate: asUtcIso(form.endDate),
    // `form.coverImageUrl` here is the raw server value (an internal MinIO object
    // key, or null) — only its truthiness matters; the actual src is this form's
    // gated cover-image endpoint.
    coverImageUrl: form.coverImageUrl ? coverImageSrc(`/forms/${id}/cover-image`, updatedAt) : null,
  };
}

/** Uploads (or replaces) a form's cover image. Returns the server's internal object key — most callers should just re-fetch the form rather than use it directly. */
export function uploadFormCoverImage(id: number, file: File): Promise<{ coverImageUrl: string }> {
  const formData = new FormData();
  formData.append("file", file);
  return apiPost<{ coverImageUrl: string }>(`/forms/${id}/cover-image`, formData);
}

export function removeFormCoverImage(id: number): Promise<null> {
  return apiDelete<null>(`/forms/${id}/cover-image`);
}

/** `POST /api/forms` returns the raw inserted row; callers only need its id. */
export function createForm(
  payload: CreateFormPayload,
): Promise<{ id: number; urlId: string }> {
  return apiPost<{ id: number; urlId: string }>("/forms", payload);
}

/** A form reference from an app URL (urlId, or a legacy numeric id) → its ids. */
export type FormRef = { id: number; urlId: string; role?: FormRole };

export function resolveFormRef(ref: string): Promise<FormRef> {
  return apiGet<FormRef>(`/forms/ref/${encodeURIComponent(ref)}`);
}

/** A form someone shared with me to view — the "Shared with me" page. */
export type ApiSharedForm = {
  id: number;
  urlId: string;
  formTitle: string | null;
  status: string | null;
  updatedAt: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  sharedAt: string | null;
  lastOpenedAt: string | null;
};

export async function listSharedForms(): Promise<ApiSharedForm[]> {
  const forms = await apiGet<ApiSharedForm[]>("/forms/shared");
  return forms.map((form) => ({
    ...form,
    updatedAt: asUtcIso(form.updatedAt),
    sharedAt: asUtcIso(form.sharedAt),
    lastOpenedAt: asUtcIso(form.lastOpenedAt),
  }));
}

/** Notes that I opened the form — drives "Date opened" sorting. Fire and forget. */
export function recordFormOpen(formId: number): Promise<null> {
  return apiPost<null>(`/forms/${formId}/open`);
}

export type ApiCollaborator = {
  email: string;
  role: "viewer";
  fullName: string | null;
  /** Their Microsoft photo, once they've signed in; null → initials. */
  avatarUrl: string | null;
};

export function getCollaborators(formId: number): Promise<ApiCollaborator[]> {
  return apiGet<ApiCollaborator[]>(`/forms/${formId}/collaborators`);
}

/** Replaces who the form is shared with (view-only); returns the saved list. */
export function replaceCollaborators(formId: number, emails: string[]): Promise<ApiCollaborator[]> {
  return apiPut<ApiCollaborator[]>(`/forms/${formId}/collaborators`, { emails });
}

export function updateForm(
  id: number,
  payload: UpdateFormPayload,
): Promise<{ id: number }> {
  return apiPatch<{ id: number }>(`/forms/${id}`, payload);
}

export function deleteForm(id: number): Promise<null> {
  return apiDelete<null>(`/forms/${id}`);
}

export type ReorderFormsPayload = {
  folderId: number | null;
  formIds: number[];
};

/** formIds must be the exact set of forms currently in that folder (or, for `folderId: null`, at the root). */
export function reorderForms(payload: ReorderFormsPayload): Promise<null> {
  return apiPatch<null>("/forms/reorder", payload);
}
