import { CreateFormCard } from '../components/forms/CreateFormCard'
import { FormSettingsPanel } from '../components/forms/FormSettingsPanel'
import { cn } from '../lib/utils'

export type CreateFormPageProps = {
  showSettings: boolean
  onCloseSettings: () => void
}

export function CreateFormPage({
  showSettings,
  onCloseSettings,
}: CreateFormPageProps) {
  return (
    <div className="min-h-[calc(100vh_-_63px)] bg-[#f5f9ff] px-14 pt-21.5 pb-16 max-[900px]:px-6 max-[560px]:px-4 max-[560px]:pt-8">
      <div
        className={cn(
          'mx-auto flex w-full items-start gap-10.25 max-[1200px]:flex-col max-[1200px]:items-center',
          showSettings ? 'max-w-[1420px]' : 'max-w-[978px]',
        )}
      >
        <CreateFormCard />
        {showSettings ? (
          <FormSettingsPanel onClose={onCloseSettings} />
        ) : null}
      </div>
    </div>
  )
}
