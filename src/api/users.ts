import { apiDelete, apiGet } from '../lib/api'
import type { AuthUser } from '../lib/auth'

/** `GET /api/users/me`: the signed-in user, plus what only the profile shows. */
export type Me = AuthUser & { organizationName: string | null }

export function getMe() {
  return apiGet<Me>('/users/me')
}

/** What deleting my account removes (`GET /api/users/me/deletion-summary`). */
export type DeletionSummary = { forms: number; responses: number }

export function getDeletionSummary() {
  return apiGet<DeletionSummary>('/users/me/deletion-summary')
}

/** Deletes my account with my forms and their responses; the server clears the auth cookie. */
export function deleteMyAccount() {
  return apiDelete<null>('/users/me')
}
