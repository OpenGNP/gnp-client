import defaultFormImage from '../assets/form-gradient.png'

/** A form card's thumbnail: its own cover, or the same default for every form without one. */
export function formCardImage(coverImageUrl: string | null | undefined): string {
  return coverImageUrl ?? defaultFormImage
}
