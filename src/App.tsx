import { useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'

import { createForm, deleteForm, reorderForms, updateForm, uploadFormCoverImage } from './api/forms'
import { createFolder, deleteFolder, reorderFolders, updateFolder } from './api/folders'
import { markWorkspaceStale, queryKeys } from './api/queries'
import { CreateFormNavbar } from './components/navigation/CreateFormNavbar'
import { Navbar } from './components/navigation/Navbar'
import { SaveDraftModal, type SaveDraftModalMode } from './components/navigation/SaveDraftModal'
import { NARROW_VIEWPORT_QUERY, Sidebar, type MoveTarget } from './components/navigation/Sidebar'
import { brand, type ProjectTreeItem } from './data/dashboard'
import { ApiError } from './lib/api'
import { showAlert } from './lib/alertDialog'
import { formPath } from './lib/formPath'
import { useAuth, useHasOrganization } from './lib/auth'
import { buildCreateFormPayload } from './lib/formMapping'
import { defaultFormAccessSettingsFor, useFormAccessSettings } from './hooks/useFormAccessSettings'
import { emptyFormEditorModel, useFormEditorModel } from './hooks/useFormEditorModel'
import { useProjectTree } from './hooks/useProjectTree'
import { useWorkspaceTree } from './hooks/useWorkspaceTree'
import { CreateFormPage } from './pages/CreateFormPage'
import { EditFormPage } from './pages/EditFormPage'
import { FilesPage } from './pages/FilesPage'
import { FormDashboardPage } from './pages/FormDashboardPage'
import { SharedPage } from './pages/SharedPage'
import { HomePage } from './pages/HomePage'
import {
  findFolderById,
  findParentFolderId,
  findProjectById,
  formNodeId,
  formNodeIdForRef,
  getSelectedProjectId,
  isNameTaken,
  folderContents,
  replaceProjectById,
  getAncestorFolderIds,
  getFolderPath,
  uniqueName,
} from './utils/projectTree'

const SIDEBAR_COLLAPSED_KEY = 'gnp.sidebar.collapsed'

function isNarrowViewport(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(NARROW_VIEWPORT_QUERY).matches
}

function readSidebarCollapsedPreference(): boolean {
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

function writeSidebarCollapsedPreference(collapsed: boolean) {
  try {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0')
  } catch {
    // Storage unavailable (private mode) — the choice just isn't remembered.
  }
}

function App() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const location = useLocation()
  const { user: authUser, logout } = useAuth()
  const newFormAccessSettings = defaultFormAccessSettingsFor(useHasOrganization())
  const workspace = useWorkspaceTree()
  const {
    projects,
    setProjects,
    openFolderIds,
    addProject,
    addFolder,
    moveProject,
    removeProject,
    renameProject,
    revealProject,
    toggleFolder,
  } = useProjectTree(workspace.projects)
  const sidebarUser = {
    name: authUser?.fullName?.trim() || authUser?.email || 'Account',
    email: authUser?.email ?? '',
  }
  const [searchTerm, setSearchTerm] = useState('')
  // Phones/tablets: the sidebar is an overlay, so it starts closed and closes again
  // after each navigation. Desktop: it's a column, and its open/closed choice is
  // remembered across reloads.
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    () => isNarrowViewport() || readSidebarCollapsedPreference(),
  )

  function setSidebarCollapsed(collapsed: boolean) {
    setIsSidebarCollapsed(collapsed)
    if (!isNarrowViewport()) {
      writeSidebarCollapsedPreference(collapsed)
    }
  }

  function closeSidebarOnNarrowViewport() {
    if (isNarrowViewport()) {
      setIsSidebarCollapsed(true)
    }
  }
  const [isCreateFormSettingsOpen, setIsCreateFormSettingsOpen] =
    useState(false)
  const [isSaveDraftModalOpen, setIsSaveDraftModalOpen] = useState(false)
  const [saveDraftMode, setSaveDraftMode] = useState<SaveDraftModalMode>('save')
  const [saveDraftOpenCount, setSaveDraftOpenCount] = useState(0)
  // Which project the open SaveDraftModal ('move' mode) is acting on — the modal can be
  // triggered from anywhere a FormCard dropdown lives (Home, Files), not just the
  // currently-open route, so the target can't be derived from the URL.
  const [moveTargetId, setMoveTargetId] = useState<string | null>(null)
  const {
    settings: createFormAccessSettings,
    updateSettings: onUpdateCreateFormAccessSettings,
    setSettings: setCreateFormAccessSettings,
  } = useFormAccessSettings(newFormAccessSettings)
  const {
    model: createFormModel,
    update: updateCreateFormModel,
    setModel: setCreateFormModel,
  } = useFormEditorModel()
  // Ref, not state: guards against a double-submit before the first render settles.
  const savingNewFormRef = useRef(false)
  const selectedProjectId = getSelectedProjectId(location.pathname)
  // The sidebar matches rows by tree-node id: forms are `form-<id>`, folders their id.
  const selectedNodeId = !selectedProjectId
    ? ''
    : location.pathname.startsWith('/forms/')
      ? formNodeIdForRef(projects, selectedProjectId)
      : selectedProjectId
  // Folders above the open form, outermost first — the dashboard's breadcrumb.
  const ancestorIds = selectedNodeId ? getAncestorFolderIds(projects, selectedNodeId) : []
  const selectedFolderPath = ancestorIds.length
    ? getFolderPath(projects, ancestorIds[ancestorIds.length - 1]!).map((folder) => ({
        id: folder.id,
        label: folder.label,
      }))
    : []
  const activeNav =
    location.pathname === '/'
      ? 'home'
      : location.pathname.startsWith('/files')
        ? 'files'
        : location.pathname === '/shared'
          ? 'shared'
          : null

  // Expand the folders above the current item whenever the route points somewhere
  // new (Home card, deep link, …) — once per item, so the user can still collapse
  // that folder afterwards. Done during render, React's "adjust state on change" pattern.
  const [revealedNodeId, setRevealedNodeId] = useState('')
  if (selectedNodeId && selectedNodeId !== revealedNodeId && projects.length > 0) {
    setRevealedNodeId(selectedNodeId)
    revealProject(selectedNodeId)
  }
  const isCreateFormRoute = location.pathname === '/create-form'
  const isFormDetailRoute = location.pathname.startsWith('/forms/')
  const isFilesRoute = location.pathname.startsWith('/files')

  function handleGoHome() {
    setIsCreateFormSettingsOpen(false)
    closeSidebarOnNarrowViewport()
    navigate('/')
  }

  function handleGoShared() {
    setIsCreateFormSettingsOpen(false)
    closeSidebarOnNarrowViewport()
    navigate('/shared')
  }

  function handleGoFiles() {
    setIsCreateFormSettingsOpen(false)
    closeSidebarOnNarrowViewport()
    navigate('/files')
  }

  // No navigate() needed — AppGate reacts to the status flip and swaps <App/> for
  // the /login redirect on its own.
  function handleLogout() {
    void logout()
  }

  function handleCreateForm() {
    setIsCreateFormSettingsOpen(false)
    closeSidebarOnNarrowViewport()
    setCreateFormModel(emptyFormEditorModel)
    setCreateFormAccessSettings(newFormAccessSettings)
    navigate('/create-form')
  }

  function parseFolderId(folderId: string | null): number | undefined {
    // The tree holds real (numeric) folder ids from the API alongside locally
    // created ones (uuid); only a numeric id maps to a persistable folder.
    return folderId && /^\d+$/.test(folderId) ? Number(folderId) : undefined
  }

  /**
   * Persist the in-progress create-form draft, drop it into the tree, open its editor.
   * Resolves false on failure (already reported), so the save dialog stays open to retry.
   */
  async function persistNewForm(folderId: string | null, status: 'draft' | 'active'): Promise<boolean> {
    if (savingNewFormRef.current) {
      return false
    }
    savingNewFormRef.current = true
    try {
      const payload = buildCreateFormPayload(createFormModel, createFormAccessSettings, {
        status,
        folderId: parseFolderId(folderId),
      })
      // Keep the title distinct from any sibling form in the destination.
      payload.formTitle = uniqueName(projects, payload.formTitle, {
        parentFolderId: folderId,
        type: 'document',
      })
      const created = await createForm(payload)
      markWorkspaceStale(queryClient)
      const idStr = String(created.id)

      if (createFormModel.coverImageFile) {
        try {
          await uploadFormCoverImage(created.id, createFormModel.coverImageFile)
        } catch {
          void showAlert('The form was saved, but the cover image failed to upload. You can try again from the editor.', {
            title: 'Cover image not uploaded',
          })
        }
      }

      addProject(folderId, {
        id: formNodeId(idStr),
        label: payload.formTitle,
        type: 'document',
        formId: idStr,
        urlId: created.urlId,
      })
      setIsCreateFormSettingsOpen(false)
      setCreateFormModel(emptyFormEditorModel)
      setCreateFormAccessSettings(newFormAccessSettings)
      navigate(formPath(created.urlId))
      return true
    } catch (error) {
      void showAlert(
        error instanceof ApiError ? error.message : 'Could not save the form. Please try again.',
      )
      return false
    } finally {
      savingNewFormRef.current = false
    }
  }

  async function handleCreateFormInFolder(folderId: string | null) {
    if (savingNewFormRef.current) {
      return
    }
    savingNewFormRef.current = true
    try {
      const title = uniqueName(projects, 'Untitled form', {
        parentFolderId: folderId,
        type: 'document',
      })
      const payload = buildCreateFormPayload(emptyFormEditorModel, newFormAccessSettings, {
        status: 'draft',
        folderId: parseFolderId(folderId),
      })
      payload.formTitle = title
      const created = await createForm(payload)
      markWorkspaceStale(queryClient)
      const idStr = String(created.id)

      addProject(folderId, {
        id: formNodeId(idStr),
        label: title,
        type: 'document',
        formId: idStr,
        urlId: created.urlId,
      })
      setIsCreateFormSettingsOpen(false)
      navigate(formPath(created.urlId))
    } catch (error) {
      void showAlert(
        error instanceof ApiError ? error.message : 'Could not create the form. Please try again.',
      )
    } finally {
      savingNewFormRef.current = false
    }
  }

  async function handleCreateFolder(name: string, parentFolderId: string | null = null) {
    const desired = name.trim()
    if (!desired) {
      return
    }
    // Silently uniquify on create (Finder-style) so the default "New folder" name
    // doesn't fail on the second one.
    const label = uniqueName(projects, desired, { parentFolderId, type: 'folder' })
    // Shown straight away (dimmed, not clickable) — otherwise it vanishes for the
    // round trip between the name being committed and the server answering.
    const pendingId = `pending-${crypto.randomUUID()}`
    // Dated now, so a date sort places it at once rather than after the next reload.
    const now = new Date().toISOString()
    addFolder({ id: pendingId, label, type: 'folder', pending: true, createdAt: now, updatedAt: now }, parentFolderId)
    try {
      const created = await createFolder({
        folderName: label,
        parentFolderId: parseFolderId(parentFolderId) ?? null,
      })
      markWorkspaceStale(queryClient)
      setProjects((current) =>
        replaceProjectById(current, pendingId, {
          id: String(created.id),
          label,
          type: 'folder',
          createdAt: now,
          updatedAt: now,
        }),
      )
    } catch (error) {
      removeProject(pendingId)
      void showAlert(
        error instanceof ApiError ? error.message : 'Could not create the folder. Please try again.',
      )
    }
  }

  /**
   * Moves or reorders a form or folder in the tree. `beforeId` (a sibling id, or
   * omitted to append) places it at a precise position. Forms persist fully: an actual
   * folder change via `updateForm`, then the destination container's whole new order
   * via `reorderForms` (needs the folder change to have landed first, or the exact-set
   * check on the reorder call would still see the old container). Folders work the
   * same way: `updateFolder({ parentFolderId })`, then their new siblings' order.
   */
  /** Resolves whether the move landed (failures are reported and rolled back). */
  async function handleMoveProject(projectId: string, target: MoveTarget): Promise<boolean> {
    const item = findProjectById(projects, projectId)
    const previousFolderId = findParentFolderId(projects, projectId)
    const snapshot = projects

    const nextProjects = moveProject(projectId, target)
    if (!item || nextProjects === snapshot) {
      return false // nothing found, or the move was rejected (e.g. folder into its own descendant)
    }

    const siblings = target.folderId
      ? (findFolderById(nextProjects, target.folderId)?.children ?? [])
      : nextProjects

    if (item.type === 'folder') {
      const numericFolderId = Number(item.id)
      const folderIds = siblings
        .filter((sibling) => sibling.type === 'folder')
        .map((sibling) => Number(sibling.id))

      if (
        !Number.isInteger(numericFolderId) ||
        numericFolderId <= 0 ||
        folderIds.some((id) => !Number.isInteger(id) || id <= 0)
      ) {
        return false
      }

      const parentFolderId = parseFolderId(target.folderId) ?? null
      // Same idea as forms below: don't undo a parent change that already landed.
      let parentChangePersisted = previousFolderId === target.folderId
      try {
        if (!parentChangePersisted) {
          await updateFolder(numericFolderId, { parentFolderId })
          parentChangePersisted = true
        }
        await reorderFolders({ parentFolderId, folderIds })
      } catch (error) {
        if (!parentChangePersisted) {
          setProjects(snapshot)
        }
        void showAlert(
          error instanceof ApiError ? error.message : 'Could not move the folder. Please try again.',
        )
        return false
      } finally {
        markWorkspaceStale(queryClient)
      }
      return true
    }

    const numericFormId = Number(item.formId ?? item.id)
    const formIds = siblings
      .filter((sibling) => sibling.type === 'document')
      .map((sibling) => Number(sibling.formId ?? sibling.id))

    if (
      !Number.isInteger(numericFormId) ||
      numericFormId <= 0 ||
      formIds.some((id) => !Number.isInteger(id) || id <= 0)
    ) {
      return false
    }

    const resolvedFolderId = parseFolderId(target.folderId) ?? null
    // Tracks whether the folder change has actually landed server-side yet, so a
    // failure on the *reorder* half below doesn't revert a move that already
    // committed — that would leave the tree showing the old folder while the server
    // (correctly) has the new one.
    let folderChangePersisted = previousFolderId === target.folderId

    try {
      if (!folderChangePersisted) {
        await updateForm(numericFormId, { folderId: resolvedFolderId })
        folderChangePersisted = true
      }
      await reorderForms({ folderId: resolvedFolderId, formIds })
    } catch (error) {
      if (!folderChangePersisted) {
        setProjects(snapshot)
      }
      void showAlert(
        error instanceof ApiError ? error.message : 'Could not move the form. Please try again.',
      )
      return false
    } finally {
      markWorkspaceStale(queryClient, numericFormId)
    }
    return true
  }

  async function handleRenameProject(id: string, label: string) {
    const trimmed = label.trim()
    const item = findProjectById(projects, id)
    if (!trimmed || !item) {
      return
    }

    // Block an explicit rename onto a name a sibling already uses (unlike create,
    // don't silently change what the user typed).
    if (
      trimmed.toLowerCase() !== item.label.trim().toLowerCase() &&
      isNameTaken(projects, trimmed, {
        parentFolderId: findParentFolderId(projects, id),
        type: item.type,
        exceptId: id,
      })
    ) {
      void showAlert(
        `A ${item.type === 'folder' ? 'folder' : 'form'} named “${trimmed}” already exists in this location.`,
        { title: 'Name already taken' },
      )
      return
    }

    const snapshot = projects
    renameProject(id, trimmed)

    try {
      if (item.type === 'folder') {
        const numericId = Number(item.id)
        if (Number.isInteger(numericId) && numericId > 0) {
          await updateFolder(numericId, { folderName: trimmed })
        }
      } else {
        const numericId = Number(item.formId ?? item.id)
        if (Number.isInteger(numericId) && numericId > 0) {
          await updateForm(numericId, { formTitle: trimmed })
        }
      }
    } catch (error) {
      setProjects(snapshot)
      void showAlert(
        error instanceof ApiError ? error.message : 'Could not rename this item. Please try again.',
      )
    } finally {
      markWorkspaceStale(
        queryClient,
        item.type === 'document' ? Number(item.formId ?? item.id) : undefined,
      )
    }
  }

  async function handleDeleteProject(id: string) {
    const item = findProjectById(projects, id)
    if (!item) {
      return
    }

    const snapshot = projects
    const isFolder = item.type === 'folder'
    // A folder goes with everything in it (the server deletes the whole subtree too).
    const deletedForms = isFolder ? folderContents(item).forms : [item]
    removeProject(id)

    const numericId = Number(isFolder ? item.id : (item.formId ?? item.id))
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return
    }

    try {
      if (isFolder) {
        await deleteFolder(numericId)
      } else {
        await deleteForm(numericId)
      }
      for (const form of deletedForms) {
        const formId = Number(form.formId ?? form.id)
        queryClient.removeQueries({ queryKey: queryKeys.form(formId) })
        queryClient.removeQueries({ queryKey: queryKeys.analytics(formId) })
      }
    } catch (error) {
      setProjects(snapshot)
      void showAlert(
        error instanceof ApiError ? error.message : `Could not delete "${item.label}". Please try again.`,
      )
    } finally {
      markWorkspaceStale(queryClient)
    }
  }

  function handleSelectProject(project: ProjectTreeItem) {
    setIsCreateFormSettingsOpen(false)
    closeSidebarOnNarrowViewport()
    const path =
      project.type === 'folder'
        ? `/files/${encodeURIComponent(project.id)}`
        : project.urlId
          ? formPath(project.urlId)
          : `/forms/${encodeURIComponent(project.formId ?? project.id)}`
    navigate(path)
  }

  function handleOpenSaveDraft() {
    setSaveDraftMode('save')
    setSaveDraftOpenCount((currentValue) => currentValue + 1)
    setIsSaveDraftModalOpen(true)
  }

  // Publishing a not-yet-saved form still needs a destination first — reuse the same
  // folder-picker modal, just with publish copy and a status of 'active' on confirm.
  function handleOpenPublish() {
    setSaveDraftMode('publish')
    setSaveDraftOpenCount((currentValue) => currentValue + 1)
    setIsSaveDraftModalOpen(true)
  }

  function handleOpenMove(id: string) {
    setMoveTargetId(id)
    setSaveDraftMode('move')
    setSaveDraftOpenCount((currentValue) => currentValue + 1)
    setIsSaveDraftModalOpen(true)
  }

  // The dialog waits on this: it stays open (spinner, buttons disabled) until the server
  // answers, and closes only on success.
  function handleConfirmSaveOrMove(folderId: string | null): Promise<boolean> {
    if (saveDraftMode === 'move') {
      return moveTargetId ? handleMoveProject(moveTargetId, { folderId }) : Promise.resolve(true)
    }
    return persistNewForm(folderId, saveDraftMode === 'publish' ? 'active' : 'draft')
  }

  // The SaveDraftModal in 'move' mode acts on either a form or a folder — tell it which,
  // and (for folders) which id to hide from the picker so it can't move into itself.
  const moveTargetItem = moveTargetId ? findProjectById(projects, moveTargetId) : null
  const moveItemIsFolder = moveTargetItem?.type === 'folder'

  // Both /files routes render the same element — useParams() inside handles the folder id.
  const filesPageElement = (
    <FilesPage
      onCreateFolder={handleCreateFolder}
      onCreateForm={handleCreateFormInFolder}
      onDeleteItem={handleDeleteProject}
      onMoveItem={handleOpenMove}
      onMoveItemInto={(id, folderId) => {
        void handleMoveProject(id, { folderId })
      }}
      isLoading={workspace.status === 'loading'}
      onRenameItem={handleRenameProject}
      projects={projects}
    />
  )

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f9ff] text-[#050608] min-[900px]:flex-row">
      {!isCreateFormRoute ? (
        <Sidebar
          activeNav={activeNav}
          brand={brand}
          isCollapsed={isSidebarCollapsed}
          isLoading={workspace.status === 'loading'}
          loadError={workspace.status === 'error'}
          onRetryLoad={workspace.retry}
          openFolderIds={openFolderIds}
          projects={projects}
          searchTerm={searchTerm}
          selectedNodeId={selectedNodeId}
          user={sidebarUser}
          onCreateFolder={handleCreateFolder}
          onCreateForm={handleCreateForm}
          onGoFiles={handleGoFiles}
          onGoShared={handleGoShared}
          onGoHome={handleGoHome}
          onLogout={handleLogout}
          onMoveProject={handleMoveProject}
          onSearchChange={setSearchTerm}
          onSelectProject={handleSelectProject}
          onToggleCollapse={() => setSidebarCollapsed(!isSidebarCollapsed)}
          onToggleFolder={toggleFolder}
        />
      ) : null}
      <main className="min-w-0 flex-1 bg-[#f5f9ff]">
        {isCreateFormRoute ? (
          <CreateFormNavbar
            formAccessSettings={createFormAccessSettings}
            formTitle={createFormModel.title.trim() || 'Untitled form'}
            isSettingsOpen={isCreateFormSettingsOpen}
            onEditSchedule={() => setIsCreateFormSettingsOpen(true)}
            onGoHome={handleGoHome}
            onPublish={handleOpenPublish}
            onSaveDraft={handleOpenSaveDraft}
            onToggleSettings={() =>
              setIsCreateFormSettingsOpen((currentValue) => !currentValue)
            }
            onUpdateFormAccessSettings={onUpdateCreateFormAccessSettings}
          />
        ) : isFormDetailRoute ? null : (
          <Navbar
            title={isFilesRoute ? 'Files' : 'Overview'}
            showSidebarToggle={isSidebarCollapsed}
            onToggleSidebar={() => setSidebarCollapsed(false)}
          />
        )}
        <Routes>
          <Route path="/" element={<HomePage onMoveItem={handleOpenMove} />} />
          <Route path="/files" element={filesPageElement} />
          <Route path="/shared" element={<SharedPage />} />
          <Route path="/files/:folderId" element={filesPageElement} />
          <Route
            path="/create-form"
            element={
              <CreateFormPage
                formAccessSettings={createFormAccessSettings}
                formModel={createFormModel}
                onCloseSettings={() => setIsCreateFormSettingsOpen(false)}
                onUpdateFormAccessSettings={onUpdateCreateFormAccessSettings}
                onUpdateFormModel={updateCreateFormModel}
                showSettings={isCreateFormSettingsOpen}
              />
            }
          />
          <Route
            path="/forms/:projectId"
            element={
              <EditFormPage
                folderPath={selectedFolderPath}
                onMove={() => handleOpenMove(selectedNodeId)}
                onToggleSidebar={() => setSidebarCollapsed(false)}
                showSidebarToggle={isSidebarCollapsed}
              />
            }
          />
          <Route
            path="/forms/:projectId/dashboard"
            element={
              <FormDashboardPage
                folderPath={selectedFolderPath}
                onToggleSidebar={() => setSidebarCollapsed(false)}
                showSidebarToggle={isSidebarCollapsed}
              />
            }
          />
        </Routes>
      </main>
      <SaveDraftModal
        key={saveDraftOpenCount}
        excludeFolderId={moveItemIsFolder ? moveTargetId : undefined}
        mode={saveDraftMode}
        moveItemLabel={moveItemIsFolder ? 'folder' : 'form'}
        onConfirm={handleConfirmSaveOrMove}
        onCreateFolder={handleCreateFolder}
        onOpenChange={setIsSaveDraftModalOpen}
        open={isSaveDraftModalOpen}
        projects={projects}
      />
    </div>
  )
}

export default App
