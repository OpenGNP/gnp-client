import { useState } from 'react'

export type WhoCanFillValue = 'anyone' | 'organization' | 'specific'

export type FormAccessSettings = {
  whoCanFill: WhoCanFillValue
  anyoneOneResponsePerPerson: boolean
  organizationRecordName: boolean
  organizationOneResponsePerPerson: boolean
  specificRecordName: boolean
  specificOneResponsePerPerson: boolean
  specificEmails: string[]
}

export const defaultFormAccessSettings: FormAccessSettings = {
  whoCanFill: 'organization',
  anyoneOneResponsePerPerson: false,
  organizationRecordName: true,
  organizationOneResponsePerPerson: false,
  specificRecordName: true,
  specificOneResponsePerPerson: false,
  specificEmails: [],
}

export function useFormAccessSettings(initial: FormAccessSettings = defaultFormAccessSettings) {
  const [settings, setSettings] = useState<FormAccessSettings>(initial)

  function updateSettings(partial: Partial<FormAccessSettings>) {
    setSettings((previous) => ({ ...previous, ...partial }))
  }

  return { settings, updateSettings, setSettings }
}
