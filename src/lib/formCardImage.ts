import { recentForms } from '../data/dashboard'

// The API has no cover-image column yet — every FormCard (HomePage's "Recent forms"
// grid, the Files page) cycles through the same bundled placeholder thumbnails keyed
// by the form's real numeric id, so a given form renders the same thumbnail no matter
// where it's shown.
const PLACEHOLDER_IMAGES = recentForms.map((form) => form.image)

export function placeholderFormImage(id: number): string {
  if (!Number.isFinite(id)) {
    return PLACEHOLDER_IMAGES[0]
  }

  return PLACEHOLDER_IMAGES[((id % PLACEHOLDER_IMAGES.length) + PLACEHOLDER_IMAGES.length) % PLACEHOLDER_IMAGES.length]
}
