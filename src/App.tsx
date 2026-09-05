import { useRef, useState } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'

import { createForm, deleteForm, updateForm } from './api/forms'
import { createFolder, deleteFolder, updateFolder } from './api/folders'
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
  findParentFolderId,
  findProjectById,
  getSelectedProjectId,
  removeFolderPromotingChildren,
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
      const created = await createForm(payload)
      const idStr = String(created.id)

      addProject(folderId, {
        id: idStr,
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
      const created = await createForm(
        buildCreateFormPayload(emptyFormEditorModel, defaultFormAccessSettings, {
          status: 'draft',
          folderId: parseFolderId(folderId),
        }),
      )
      const idStr = String(created.id)

      addProject(folderId, {
        id: idStr,
        label: 'Untitled form',
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
    const label = name.trim()
    if (!label) {
      return
    }
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
   * omitted to append) places it at a precise position — purely a local sidebar
   * convenience, not persisted, since display order isn't a column the API tracks for
   * either forms or folders. Only an actual *folder change* for a form persists (its
   * `folderId` is a real column); a folder's own container has nowhere to persist to
   * yet (no `parent_folder_id` support), so moving a folder — reorder or into another
   * folder — stays the client-side-only convenience it always was.
   */
  async function handleMoveProject(
    projectId: string,
    target: MoveTarget,
  ) {
    const item = findProjectById(projects, projectId)
    const previousFolderId = findParentFolderId(projects, projectId)
    const snapshot = projects

    moveProject(projectId, target)

    if (!item || item.type === 'folder' || previousFolderId === target.folderId) {
      return
    }

    const numericFormId = Number(item.formId ?? item.id)
    if (!Number.isInteger(numericFormId) || numericFormId <= 0) {
      return
    }

    try {
      await updateForm(numericFormId, { folderId: parseFolderId(target.folderId) ?? null })
    } catch (error) {
      setProjects(snapshot)
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
        : `/forms/${encodeURIComponent(project.id)}`
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
          <Route
            path="/files"
            element={
              <FilesPage
                onCreateFolder={handleCreateFolder}
                onCreateForm={handleCreateFormInFolder}
                onDeleteItem={handleDeleteProject}
                onMoveItem={handleOpenMove}
                onRenameItem={handleRenameProject}
                projects={projects}
              />
            }
          />
          <Route
            path="/files/:folderId"
            element={
              <FilesPage
                onCreateFolder={handleCreateFolder}
                onCreateForm={handleCreateFormInFolder}
                onDeleteItem={handleDeleteProject}
                onMoveItem={handleOpenMove}
                onRenameItem={handleRenameProject}
                projects={projects}
              />
            }
          />
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
                onMove={() => handleOpenMove(selectedProjectId)}
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
        mode={saveDraftMode}
        onConfirm={handleConfirmSaveOrMove}
        onOpenChange={setIsSaveDraftModalOpen}
        open={isSaveDraftModalOpen}
        projects={projects}
      />
    </div>
  )
}

export default App
