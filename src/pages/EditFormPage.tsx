import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

import { getForm, updateForm } from '../api/forms'
import { CreateFormCard } from '../components/forms/CreateFormCard'
import { FormSettingsPanel } from '../components/forms/FormSettingsPanel'
import { FormActionBar, type SaveStatus } from '../components/navigation/FormActionBar'
import { FormDetailTabs } from '../components/navigation/FormDetailTabs'
import { getDashboardAnalytics } from '../data/dashboardAnalytics'
import {
  defaultFormAccessSettings,
  formAccessSettingsChanged,
  useFormAccessSettings,
  type FormAccessSettings,
} from '../hooks/useFormAccessSettings'
import { useFormEditorModel } from '../hooks/useFormEditorModel'
import { ApiError } from '../lib/api'
import {
  accessSettingsFromForm,
  buildFieldPayloads,
  buildUpdateFormPayload,
  formDetailToModel,
} from '../lib/formMapping'
import { cn } from '../lib/utils'

type LoadStatus = 'loading' | 'ready' | 'error'

export type EditFormPageProps = {
  showSidebarToggle?: boolean
  onToggleSidebar?: () => void
  onMove?: () => void
}

export function EditFormPage({
  showSidebarToggle = false,
  onToggleSidebar,
  onMove,
}: EditFormPageProps) {
  const { projectId } = useParams()
  const formId = Number(projectId)
  const hasValidId = Number.isInteger(formId) && formId > 0

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [loadStatus, setLoadStatus] = useState<LoadStatus>(hasValidId ? 'loading' : 'error')
  const [loadError, setLoadError] = useState(
    hasValidId ? '' : "This form hasn't been saved yet, so there's nothing to edit.",
  )
  const [reloadKey, setReloadKey] = useState(0)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [isPublished, setIsPublished] = useState(false)
  // The form's unguessable public token, for the respondent-facing share link.
  const [publicToken, setPublicToken] = useState('')

  const { model, update, setModel } = useFormEditorModel()
  const { settings, updateSettings, setSettings } = useFormAccessSettings()

  // Access settings as last persisted — the Publish popover's status chip / schedule
  // readout derive from this, not the live edits, so nothing in it looks changed
  // until the user actually saves. Refreshed on load and after a successful save.
  const [savedSettings, setSavedSettings] = useState<FormAccessSettings>(defaultFormAccessSettings)
  const hasUnsavedChanges = formAccessSettingsChanged(savedSettings, settings)

  // Snapshot of the fields as loaded — lets a settings-only save skip sending
  // `fields` (which the server refuses once a form has responses).
  const loadedFieldsRef = useRef('')

  const hasDashboardData = Boolean(getDashboardAnalytics(projectId))

  useEffect(() => {
    if (!hasValidId) {
      return
    }

    let cancelled = false

    getForm(formId)
      .then((detail) => {
        if (cancelled) return
        const nextModel = formDetailToModel(detail)
        const nextSettings = accessSettingsFromForm(detail)
        setModel(nextModel)
        setSettings(nextSettings)
        setSavedSettings(nextSettings)
        setPublicToken(detail.publicToken)
        setIsPublished(detail.status === 'active')
        loadedFieldsRef.current = JSON.stringify(buildFieldPayloads(nextModel))
        setLoadStatus('ready')
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setLoadError(
          error instanceof ApiError ? error.message : 'Something went wrong loading this form.',
        )
        setLoadStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [formId, hasValidId, reloadKey, setModel, setSettings])

  function retryLoad() {
    setLoadStatus('loading')
    setLoadError('')
    setReloadKey((key) => key + 1)
  }

  async function handleSave(publish: boolean) {
    if (!hasValidId || saveStatus === 'saving') {
      return
    }

    const currentFields = JSON.stringify(buildFieldPayloads(model))
    const includeFields = currentFields !== loadedFieldsRef.current

    setSaveStatus('saving')
    try {
      await updateForm(
        formId,
        buildUpdateFormPayload(model, settings, {
          status: publish ? 'active' : undefined,
          includeFields,
        }),
      )
      if (includeFields) {
        loadedFieldsRef.current = currentFields
      }
      if (publish) {
        setIsPublished(true)
      }
      // Only now do the modal's readouts / reminder catch up to the edits.
      setSavedSettings(settings)
      setSaveStatus('saved')
    } catch (error) {
      setSaveStatus('error')
      window.alert(
        error instanceof ApiError ? error.message : 'Could not save the form. Please try again.',
      )
    }
  }

  return (
    <div>
      <div className="sticky top-0 z-30 bg-[#f5f9ff]">
        <FormDetailTabs
          hasDashboardData={hasDashboardData}
          onToggleSidebar={onToggleSidebar}
          showSidebarToggle={showSidebarToggle}
        />
        {loadStatus === 'ready' ? (
          <div className="flex justify-end bg-[#f5f9ff] px-14 py-4 max-[900px]:px-6 max-[560px]:px-4">
            <FormActionBar
              defaultPublished={isPublished}
              formAccessSettings={settings}
              isSettingsOpen={isSettingsOpen}
              mode="edit"
              onEditSchedule={() => setIsSettingsOpen(true)}
              onMove={onMove}
              onPublish={() => handleSave(true)}
              onSaveDraft={() => handleSave(false)}
              onToggleSettings={() => setIsSettingsOpen((open) => !open)}
              onUpdateFormAccessSettings={updateSettings}
              savedAccessSettings={savedSettings}
              saveStatus={saveStatus}
              shareUrl={publicToken ? `${window.location.origin}/f/${publicToken}` : undefined}
            />
          </div>
        ) : null}
      </div>

      <div className="bg-[#f5f9ff] px-14 pb-16 max-[900px]:px-6 max-[560px]:px-4">
        {loadStatus === 'loading' ? (
          <p className="mx-auto max-w-[978px] pt-10 text-[14px] text-[#8b8e98]">Loading this form…</p>
        ) : loadStatus === 'error' ? (
          <div className="mx-auto flex max-w-[978px] flex-wrap items-center gap-3 pt-10 text-[14px] text-[#e0507a]">
            <span>{loadError}</span>
            {hasValidId ? (
              <button
                className="cursor-pointer rounded-[5px] border border-[#e0507a] px-3 py-1 text-[13px] font-medium text-[#e0507a] transition-colors hover:bg-[#fcf3f6]"
                onClick={retryLoad}
                type="button"
              >
                Try again
              </button>
            ) : null}
          </div>
        ) : (
          <div
            className={cn(
              'mx-auto flex w-full items-start gap-10.25 max-[1200px]:flex-col max-[1200px]:items-center',
              isSettingsOpen ? 'max-w-[1420px]' : 'max-w-[978px]',
            )}
          >
            <CreateFormCard onChange={update} value={model} />
            {isSettingsOpen ? (
              <FormSettingsPanel
                hasUnsavedChanges={hasUnsavedChanges}
                onClose={() => setIsSettingsOpen(false)}
                onUpdateSettings={updateSettings}
                settings={settings}
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
