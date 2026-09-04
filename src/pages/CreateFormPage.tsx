import { CreateFormCard } from '../components/forms/CreateFormCard'
import { FormSettingsPanel } from '../components/forms/FormSettingsPanel'
import type { FormAccessSettings } from '../hooks/useFormAccessSettings'
import type { FormEditorModel } from '../hooks/useFormEditorModel'
import { cn } from '../lib/utils'

export type CreateFormPageProps = {
  showSettings: boolean
  onCloseSettings: () => void
  formAccessSettings: FormAccessSettings
  onUpdateFormAccessSettings: (partial: Partial<FormAccessSettings>) => void
  formModel: FormEditorModel
  onUpdateFormModel: (partial: Partial<FormEditorModel>) => void
}

export function CreateFormPage({
  showSettings,
  onCloseSettings,
  formAccessSettings,
  onUpdateFormAccessSettings,
  formModel,
  onUpdateFormModel,
}: CreateFormPageProps) {
  return (
    <div className="min-h-[calc(100vh_-_63px)] bg-[#f5f9ff] px-14 pt-21.5 pb-16 font-['Inter_Variable'] max-[900px]:px-6 max-[560px]:px-4 max-[560px]:pt-8">
      <div
        className={cn(
          'mx-auto flex w-full items-start gap-10.25 max-[1200px]:flex-col max-[1200px]:items-center',
          showSettings ? 'max-w-[1420px]' : 'max-w-[978px]',
        )}
      >
        <CreateFormCard onChange={onUpdateFormModel} value={formModel} />
        {showSettings ? (
          <FormSettingsPanel
            onClose={onCloseSettings}
            onUpdateSettings={onUpdateFormAccessSettings}
            settings={formAccessSettings}
          />
        ) : null}
      </div>
    </div>
  )
}
