import { useState } from 'react'

export type WhoCanFillValue = 'anyone' | 'organization' | 'specific'

export type FormAccessSettings = {
  // Not strictly "who can fill" — the Publish Setting popover's "Open for answer"
  // toggle and the Settings panel's response window live here too, since they all
  // round-trip through the same load/save cycle. Dates are ISO strings; `null` means
  // no restriction (unchecked in the UI).
  acceptingResponses: boolean
  startDate: string | null
  endDate: string | null
  whoCanFill: WhoCanFillValue
  anyoneOneResponsePerPerson: boolean
  organizationRecordName: boolean
  organizationOneResponsePerPerson: boolean
  specificRecordName: boolean
  specificOneResponsePerPerson: boolean
  specificEmails: string[]
}

export const defaultFormAccessSettings: FormAccessSettings = {
  acceptingResponses: true,
  startDate: null,
  endDate: null,
  whoCanFill: 'organization',
  anyoneOneResponsePerPerson: false,
  organizationRecordName: true,
  organizationOneResponsePerPerson: false,
  specificRecordName: true,
  specificOneResponsePerPerson: false,
  specificEmails: [],
}

/** True when two access-settings objects differ on any editable field — i.e. a Save is pending. */
export function formAccessSettingsChanged(a: FormAccessSettings, b: FormAccessSettings): boolean {
  return (
    a.acceptingResponses !== b.acceptingResponses ||
    a.startDate !== b.startDate ||
    a.endDate !== b.endDate ||
    a.whoCanFill !== b.whoCanFill ||
    a.anyoneOneResponsePerPerson !== b.anyoneOneResponsePerPerson ||
    a.organizationRecordName !== b.organizationRecordName ||
    a.organizationOneResponsePerPerson !== b.organizationOneResponsePerPerson ||
    a.specificRecordName !== b.specificRecordName ||
    a.specificOneResponsePerPerson !== b.specificOneResponsePerPerson ||
    a.specificEmails.length !== b.specificEmails.length ||
    a.specificEmails.some((email, index) => email !== b.specificEmails[index])
  )
}

export function useFormAccessSettings(initial: FormAccessSettings = defaultFormAccessSettings) {
  const [settings, setSettings] = useState<FormAccessSettings>(initial)

  function updateSettings(partial: Partial<FormAccessSettings>) {
    setSettings((previous) => ({ ...previous, ...partial }))
  }

  return { settings, updateSettings, setSettings }
}
