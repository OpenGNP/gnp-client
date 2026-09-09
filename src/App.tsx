import { useRef, useState } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'

import { createForm, deleteForm, reorderForms, updateForm } from './api/forms'
import { createFolder, deleteFolder, reorderFolders, updateFolder } from './api/folders'
import { CreateFormNavbar } from './components/navigation/CreateFormNavbar'
import { Navbar } from './components/navigation/Navbar'
import { SaveDraftModal, type SaveDraftModalMode } from './components/navigation/SaveDraftModal'
import { Sidebar, type MoveTarget } from './components/navigation/Sidebar'
import { brand, type ProjectTreeItem } from './data/dashboard'
import { ApiError } from './lib/api'
import { useAuth } from './lib/auth'
import { buildCreateFormPayload } from './lib/formMapping'
import { defaultFormAccessSettings, useFormAccessSettings } from './hooks/useFormAccessSettings'
import { emptyFormEditorModel, useFormEditorModel } from './hooks/useFormEditorModel'
import { useProjectTree } from './hooks/useProjectTree'
import { useWorkspaceTree } from './hooks/useWorkspaceTree'
import { CreateFormPage } from './pages/CreateFormPage'
import { EditFormPage } from './pages/EditFormPage'
import { FilesPage } from './pages/FilesPage'
import { FormDashboardPage } from './pages/FormDashboardPage'
import { HomePage } from './pages/HomePage'
import {
  findFolderById,
  findParentFolderId,
  findProjectById,
  formNodeId,
  getSelectedProjectId,
  isNameTaken,
  removeFolderPromotingChildren,
  uniqueName,
} from './utils/projectTree'

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user: authUser } = useAuth()
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
    toggleFolder,
  } = useProjectTree(workspace.projects)
  const sidebarUser = {
    name: authUser?.fullName?.trim() || authUser?.email || 'Account',
    email: authUser?.email ?? '',
  }
  const [searchTerm, setSearchTerm] = useState('')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
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
  } = useFormAccessSettings()
  const {
    model: createFormModel,
    update: updateCreateFormModel,
    setModel: setCreateFormModel,
  } = useFormEditorModel()
  // Ref, not state: guards against a double-submit before the first render settles.
  const savingNewFormRef = useRef(false)
  const selectedProjectId = getSelectedProjectId(location.pathname)
  const isCreateFormRoute = location.pathname === '/create-form'
  const isFormDetailRoute = location.pathname.startsWith('/forms/')
  const isFilesRoute = location.pathname.startsWith('/files')

  function handleGoHome() {
    setIsCreateFormSettingsOpen(false)
    navigate('/')
  }

  function handleGoFiles() {
    setIsCreateFormSettingsOpen(false)
    navigate('/files')
  }

  function handleCreateForm() {
    setIsCreateFormSettingsOpen(false)
    setCreateFormModel(emptyFormEditorModel)
    setCreateFormAccessSettings(defaultFormAccessSettings)
    navigate('/create-form')
  }

  function parseFolderId(folderId: string | null): number | undefined {
    // The tree holds real (numeric) folder ids from the API alongside locally
    // created ones (uuid); only a numeric id maps to a persistable folder.
    return folderId && /^\d+$/.test(folderId) ? Number(folderId) : undefined
  }

  /** Persist the in-progress create-form draft, drop it into the tree, open its editor. */
  async function persistNewForm(folderId: string | null, status: 'draft' | 'active') {
    if (savingNewFormRef.current) {
      return
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
      const idStr = String(created.id)

      addProject(folderId, {
        id: formNodeId(idStr),
        label: payload.formTitle,
        type: 'document',
        formId: idStr,
      })
      setIsCreateFormSettingsOpen(false)
      setCreateFormModel(emptyFormEditorModel)
      setCreateFormAccessSettings(defaultFormAccessSettings)
      navigate(`/forms/${idStr}`)
    } catch (error) {
      window.alert(
        error instanceof ApiError ? error.message : 'Could not save the form. Please try again.',
      )
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
      const payload = buildCreateFormPayload(emptyFormEditorModel, defaultFormAccessSettings, {
        status: 'draft',
        folderId: parseFolderId(folderId),
      })
      payload.formTitle = title
      const created = await createForm(payload)
      const idStr = String(created.id)

      addProject(folderId, {
        id: formNodeId(idStr),
        label: title,
        type: 'document',
        formId: idStr,
      })
      setIsCreateFormSettingsOpen(false)
      navigate(`/forms/${idStr}`)
    } catch (error) {
      window.alert(
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
    try {
      const created = await createFolder({ folderName: label })
      addFolder({ id: String(created.id), label, type: 'folder' }, parentFolderId)
    } catch (error) {
      window.alert(
        error instanceof ApiError ? error.message : 'Could not create the folder. Please try again.',
      )
    }
  }

  /**
   * Moves or reorders a form or folder in the tree. `beforeId` (a sibling id, or
   * omitted to append) places it at a precise position. Forms persist fully: an actual
   * folder change via `updateForm`, then the destination container's whole new order
   * via `reorderForms` (needs the folder change to have landed first, or the exact-set
   * check on the reorder call would still see the old container). Folders persist only
   * their order among root-level siblings — dragging one *into* another folder still
   * doesn't stick (no `parent_folder_id` support), so that case is left as the
   * client-side-only convenience it always was.
   */
  async function handleMoveProject(projectId: string, target: MoveTarget) {
    const item = findProjectById(projects, projectId)
    const previousFolderId = findParentFolderId(projects, projectId)
    const snapshot = projects

    const nextProjects = moveProject(projectId, target)
    if (!item || nextProjects === snapshot) {
      return // nothing found, or the move was rejected (e.g. folder into its own descendant)
    }

    const siblings = target.folderId
      ? (findFolderById(nextProjects, target.folderId)?.children ?? [])
      : nextProjects

    if (item.type === 'folder') {
      if (target.folderId !== null) {
        return // moved into another folder — not persisted, per the note above
      }

      const folderIds = siblings
        .filter((sibling) => sibling.type === 'folder')
        .map((sibling) => Number(sibling.id))

      if (folderIds.some((id) => !Number.isInteger(id) || id <= 0)) {
        return
      }

      try {
        await reorderFolders({ folderIds })
      } catch (error) {
        setProjects(snapshot)
        window.alert(
          error instanceof ApiError ? error.message : 'Could not reorder folders. Please try again.',
        )
      }
      return
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
      return
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
      window.alert(
        error instanceof ApiError ? error.message : 'Could not move the form. Please try again.',
      )
    }
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
      window.alert(
        `A ${item.type === 'folder' ? 'folder' : 'form'} named “${trimmed}” already exists in this location.`,
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
      window.alert(
        error instanceof ApiError ? error.message : 'Could not rename this item. Please try again.',
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

    if (isFolder) {
      setProjects((current) => removeFolderPromotingChildren(current, id))
    } else {
      removeProject(id)
    }

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
    } catch (error) {
      setProjects(snapshot)
      window.alert(
        error instanceof ApiError ? error.message : `Could not delete "${item.label}". Please try again.`,
      )
    }
  }

  function handleSelectProject(project: ProjectTreeItem) {
    setIsCreateFormSettingsOpen(false)
    const path =
      project.type === 'folder'
        ? `/files/${encodeURIComponent(project.id)}`
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

  function handleConfirmSaveOrMove(folderId: string | null) {
    if (saveDraftMode === 'move') {
      if (moveTargetId) {
        void handleMoveProject(moveTargetId, { folderId })
      }
      return
    }

    void persistNewForm(folderId, saveDraftMode === 'publish' ? 'active' : 'draft')
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
      onRenameItem={handleRenameProject}
      projects={projects}
    />
  )

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f9ff] text-[#050608] min-[901px]:flex-row">
      {!isCreateFormRoute ? (
        <Sidebar
          brand={brand}
          isCollapsed={isSidebarCollapsed}
          openFolderIds={openFolderIds}
          projects={projects}
          searchTerm={searchTerm}
          selectedProjectId={selectedProjectId}
          user={sidebarUser}
          onCreateFolder={handleCreateFolder}
          onCreateForm={handleCreateForm}
          onGoFiles={handleGoFiles}
          onGoHome={handleGoHome}
          onMoveProject={handleMoveProject}
          onSearchChange={setSearchTerm}
          onSelectProject={handleSelectProject}
          onToggleCollapse={() =>
            setIsSidebarCollapsed((currentValue) => !currentValue)
          }
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
            onToggleSidebar={() => setIsSidebarCollapsed(false)}
          />
        )}
        <Routes>
          <Route path="/" element={<HomePage onMoveItem={handleOpenMove} />} />
          <Route path="/files" element={filesPageElement} />
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
                onMove={() => handleOpenMove(formNodeId(selectedProjectId))}
                onToggleSidebar={() => setIsSidebarCollapsed(false)}
                showSidebarToggle={isSidebarCollapsed}
              />
            }
          />
          <Route
            path="/forms/:projectId/dashboard"
            element={
              <FormDashboardPage
                onToggleSidebar={() => setIsSidebarCollapsed(false)}
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
        onOpenChange={setIsSaveDraftModalOpen}
        open={isSaveDraftModalOpen}
        projects={projects}
      />
    </div>
  )
}

export default App
