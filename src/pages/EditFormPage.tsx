import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'

import {
  removeFormCoverImage,
  updateForm,
  uploadFormCoverImage,
  type ApiFormDetail,
} from '../api/forms'
import { formQuery, queryKeys } from '../api/queries'
import { CreateFormCard } from '../components/forms/CreateFormCard'
import { FormSettingsPanel } from '../components/forms/FormSettingsPanel'
import { FormActionBar, type SaveStatus } from '../components/navigation/FormActionBar'
import { FolderBreadcrumbBar } from '../components/navigation/FolderBreadcrumb'
import { FormDetailTabs } from '../components/navigation/FormDetailTabs'
import {
  defaultFormAccessSettings,
  formAccessSettingsChanged,
  useFormAccessSettings,
  type FormAccessSettings,
} from '../hooks/useFormAccessSettings'
import { useIsSlow } from '../hooks/useIsSlow'
import { useFormEditorModel } from '../hooks/useFormEditorModel'
import { useRecordFormOpen } from '../hooks/useRecordFormOpen'
import { useRouteForm } from '../hooks/useRouteForm'
import { FormLoadError } from '../components/FormLoadError'
import { ApiError } from '../lib/api'
import { showAlert } from '../lib/alertDialog'
import {
  accessSettingsFromForm,
  buildFieldPayloads,
  buildUpdateFormPayload,
  formDetailToModel,
} from '../lib/formMapping'
import { FormEditorSkeleton } from '../components/skeletons/FormEditorSkeleton'
import { cn } from '../lib/utils'

export type EditFormPageProps = {
  showSidebarToggle?: boolean
  onToggleSidebar?: () => void
  onMove?: () => void
  /** Folders containing this form, outermost first (empty: at the root of My Project). */
  folderPath?: { id: string; label: string }[]
}

export function EditFormPage({
  showSidebarToggle = false,
  onToggleSidebar,
  onMove,
  folderPath = [],
}: EditFormPageProps) {
  // The URL carries the form's urlId; the API calls use its numeric id.
  const routeForm = useRouteForm()
  const formId = routeForm.formId ?? 0
  const hasValidId = routeForm.formId !== null
  useRecordFormOpen(routeForm.role === 'owner' ? routeForm.formId : null)

  const queryClient = useQueryClient()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [isPublished, setIsPublished] = useState(false)
  // Raw forms.status ('draft' | 'active' | 'closed' | 'archived') — drives the
  // editor's status chip (via formStatusBadge) and the Close/Reopen action.
  const [formStatus, setFormStatus] = useState<string | null>(null)
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
  // `fields` (once a form has responses, the server edits them in place).
  const [loadedFields, setLoadedFields] = useState('')
  // Whether the form had a cover when loaded — so handleSave knows a null
  // `model.coverImageUrl` at save time means "the user removed it" and needs a
  // DELETE call, not "there was never one".
  const [initialHadCover, setInitialHadCover] = useState(false)

  // Any saved form has a dashboard (the Response tab reads live data; the page shows
  // its own empty state when there are no submissions yet).
  const hasDashboardData = hasValidId

  const formResult = useQuery({ ...formQuery(formId), enabled: hasValidId })

  /** Replaces all editor state with a form as loaded from the server. */
  function seedFrom(detail: ApiFormDetail) {
    const nextModel = formDetailToModel(detail)
    const nextSettings = accessSettingsFromForm(detail)
    setModel(nextModel)
    setSettings(nextSettings)
    setSavedSettings(nextSettings)
    setPublicToken(detail.publicToken)
    setFormStatus(detail.status)
    // "Published" (Save-flow UI, share link) covers both active and closed —
    // a closed form was published at some point and can be reopened, it
    // shouldn't fall back to the pre-publish "Publish for the first time" UI.
    setIsPublished(detail.status === 'active' || detail.status === 'closed')
    setLoadedFields(JSON.stringify(buildFieldPayloads(nextModel)))
    setInitialHadCover(Boolean(nextModel.coverImageUrl))
  }

  // The editor holds its own copy of the form, seeded once per form id — a later
  // background refetch must never overwrite what the user is typing. Seeded during
  // render (React's "adjust state when a prop changes" pattern) rather than in an
  // effect. A cached-but-stale copy waits for its refetch so editing starts from
  // the latest version; a fresh one seeds instantly.
  const [seededFormId, setSeededFormId] = useState<number | null>(null)
  const formData = formResult.data
  if (
    hasValidId &&
    formData &&
    seededFormId !== formId &&
    !(formResult.isStale && formResult.isFetching)
  ) {
    setSeededFormId(formId)
    seedFrom(formData)
  }

  const loadStatus =
    routeForm.status === 'error'
      ? 'error'
      : !hasValidId
        ? 'loading' // still resolving the URL
        : seededFormId === formId
          ? 'ready'
          : formResult.isError
            ? 'error'
            : 'loading'
  const failure = routeForm.status === 'error' ? routeForm.error : formResult.error
  const loadError =
    routeForm.status === 'error' && !failure
      ? "This form hasn't been saved yet, so there's nothing to edit."
      : 'Something went wrong loading this form.'

  function retryLoad() {
    if (routeForm.status === 'error') routeForm.retry()
    else void formResult.refetch()
  }

  async function handleSave(publish: boolean) {
    if (!hasValidId || saveStatus === 'saving') {
      return
    }

    const currentFields = JSON.stringify(buildFieldPayloads(model))
    const includeFields = currentFields !== loadedFields
    // The modal's Save/Publish button always calls this with publish=true, whether
    // the form is a fresh draft or already active/closed — only force status to
    // 'active' on a genuine first publish (draft → active). Otherwise a plain Save
    // must never silently reopen a form the admin closed on purpose.
    const nextStatus = publish && formStatus === 'draft' ? 'active' : undefined

    setSaveStatus('saving')
    try {
      await updateForm(
        formId,
        buildUpdateFormPayload(model, settings, {
          status: nextStatus,
          includeFields,
        }),
      )
      if (includeFields) {
        setLoadedFields(currentFields)
      }
      if (model.coverImageFile) {
        await uploadFormCoverImage(formId, model.coverImageFile)
        update({ coverImageFile: null })
        setInitialHadCover(true)
      } else if (model.coverImageUrl === null && initialHadCover) {
        await removeFormCoverImage(formId)
        setInitialHadCover(false)
      }
      if (nextStatus) {
        setIsPublished(true)
        setFormStatus(nextStatus)
      }
      // Only now do the modal's readouts / reminder catch up to the edits.
      setSavedSettings(settings)
      setSaveStatus('saved')
      // Title / status / questions may have changed: refresh the lists (sidebar,
      // Home) and drop cached dashboard analytics for this form.
      void queryClient.invalidateQueries({ queryKey: queryKeys.forms })
      void queryClient.invalidateQueries({ queryKey: queryKeys.analytics(formId) })
      // Newly added questions only get their database ids on the server. Re-read the
      // form (without the loading state) and re-seed, so the next save sends those
      // ids and edits them in place, rather than treating them as new and replacing them.
      if (includeFields) {
        const fresh = await queryClient.fetchQuery({ ...formQuery(formId), staleTime: 0 })
        seedFrom(fresh)
      } else {
        void queryClient.invalidateQueries({ queryKey: queryKeys.form(formId) })
      }
    } catch (error) {
      setSaveStatus('error')
      void showAlert(
        error instanceof ApiError ? error.message : 'Could not save the form. Please try again.',
      )
    }
  }

  async function handleReopenForm(): Promise<boolean> {
    if (!hasValidId) return false
    try {
      await updateForm(formId, { status: 'active' })
      setFormStatus('active')
      setIsPublished(true)
      void queryClient.invalidateQueries({ queryKey: queryKeys.form(formId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.forms })
      return true
    } catch (error) {
      void showAlert(
        error instanceof ApiError ? error.message : 'Could not reopen the form. Please try again.',
      )
      return false
    }
  }

  // While a save is in flight the editor is read-only, so nothing typed meanwhile is
  // silently left out of it. Unlocked again if the server is unusually slow, so a stuck
  // request never traps anyone.
  const isSlowSave = useIsSlow(saveStatus === 'saving')
  const isSaveLocked = saveStatus === 'saving' && !isSlowSave

  // Shared with them to view only: there's nothing to edit — send them to the dashboard.
  const { projectId = '' } = useParams()
  if (routeForm.role === 'viewer') {
    return <Navigate replace to={`/forms/${encodeURIComponent(projectId)}/dashboard`} />
  }

  return (
    <div>
      <div className="sticky top-0 z-30 bg-[#f5f9ff]">
        <FormDetailTabs
          hasDashboardData={hasDashboardData}
          onToggleSidebar={onToggleSidebar}
          showSidebarToggle={showSidebarToggle}
        />
        {/* Where the form lives — its name is edited in the card below, so not repeated here. */}
        <FolderBreadcrumbBar
          actions={
            loadStatus === 'ready' ? (
              <FormActionBar
                defaultPublished={isPublished}
                defaultStatus={formStatus}
                formAccessSettings={settings}
                isSettingsOpen={isSettingsOpen}
                mode="edit"
                onEditSchedule={() => setIsSettingsOpen(true)}
                onMove={onMove}
                onPublish={() => handleSave(true)}
                onReopenForm={handleReopenForm}
                onSaveDraft={() => handleSave(false)}
                onToggleSettings={() => setIsSettingsOpen((open) => !open)}
                onUpdateFormAccessSettings={updateSettings}
                savedAccessSettings={savedSettings}
                saveLocked={isSaveLocked}
                saveSlow={isSlowSave}
                saveStatus={saveStatus}
                shareUrl={publicToken ? `${window.location.origin}/f/${publicToken}` : undefined}
              />
            ) : null
          }
          path={folderPath}
        />
      </div>

      <div className="bg-[#f5f9ff] px-14 pb-16 max-[900px]:px-6 max-[560px]:px-4">
        {loadStatus === 'loading' ? (
          <FormEditorSkeleton />
        ) : loadStatus === 'error' ? (
          <div className="flex justify-center pt-16">
            <FormLoadError error={failure} fallbackMessage={loadError} onRetry={retryLoad} />
          </div>
        ) : (
          <div
            aria-busy={isSaveLocked || undefined}
            className={cn(
              'mx-auto flex w-full items-start gap-10.25 transition-opacity max-[1200px]:flex-col max-[1200px]:items-center',
              isSettingsOpen ? 'max-w-[1420px]' : 'max-w-[978px]',
              isSaveLocked && 'opacity-60',
            )}
            inert={isSaveLocked}
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
