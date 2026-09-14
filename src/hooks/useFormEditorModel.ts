import { useState } from 'react'

import type { Question } from '../components/forms/question-types'

/**
 * The editable content of a form as the CreateFormCard renders it: the header
 * fields plus the two question sections. Access/publish settings live separately
 * in `useFormAccessSettings`. `src/lib/formMapping.ts` maps this to/from the API.
 */
export type FormEditorModel = {
  title: string
  description: string
  /** What to show in the cover `<img>` right now — the server's URL for an existing
   *  cover, or a local `URL.createObjectURL` preview while `coverImageFile` is staged. */
  coverImageUrl: string | null
  /** A newly-picked cover not yet uploaded — the form needs an id first (on create),
   *  so the actual upload happens on save, not on file selection. */
  coverImageFile: File | null
  demographic: Question[]
  feedback: Question[]
}

export const emptyFormEditorModel: FormEditorModel = {
  title: '',
  description: '',
  coverImageUrl: null,
  coverImageFile: null,
  demographic: [],
  feedback: [],
}

export function useFormEditorModel(initial: FormEditorModel = emptyFormEditorModel) {
  const [model, setModel] = useState<FormEditorModel>(initial)

  function update(partial: Partial<FormEditorModel>) {
    setModel((previous) => ({ ...previous, ...partial }))
  }

  return { model, update, setModel }
}
