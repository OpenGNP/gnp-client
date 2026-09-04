import { useRef, useState } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'

import { createForm } from './api/forms'
import { CreateFormNavbar } from './components/navigation/CreateFormNavbar'
import { Navbar } from './components/navigation/Navbar'
import { SaveDraftModal } from './components/navigation/SaveDraftModal'
import { Sidebar } from './components/navigation/Sidebar'
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
import { getSelectedProjectId } from './utils/projectTree'

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user: authUser } = useAuth()
  const workspace = useWorkspaceTree()
  const {
    projects,
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
  const [saveDraftMode, setSaveDraftMode] = useState<'save' | 'move'>('save')
  const [saveDraftOpenCount, setSaveDraftOpenCount] = useState(0)
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

  function handleOpenMove() {
    setSaveDraftMode('move')
    setSaveDraftOpenCount((currentValue) => currentValue + 1)
    setIsSaveDraftModalOpen(true)
  }

  function handleConfirmSaveOrMove(folderId: string | null) {
    if (saveDraftMode === 'move') {
      moveProject(selectedProjectId, folderId)
      return
    }

    void persistNewForm(folderId, 'draft')
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
          onCreateFolder={addFolder}
          onCreateForm={handleCreateForm}
          onGoFiles={handleGoFiles}
          onGoHome={handleGoHome}
          onMoveProject={moveProject}
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
            onPublish={() => persistNewForm(null, 'active')}
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
          <Route path="/" element={<HomePage />} />
          <Route
            path="/files"
            element={
              <FilesPage
                onCreateFolder={addFolder}
                onCreateForm={handleCreateFormInFolder}
                onDeleteItem={removeProject}
                onRenameItem={renameProject}
                projects={projects}
              />
            }
          />
          <Route
            path="/files/:folderId"
            element={
              <FilesPage
                onCreateFolder={addFolder}
                onCreateForm={handleCreateFormInFolder}
                onDeleteItem={removeProject}
                onRenameItem={renameProject}
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
                onMove={handleOpenMove}
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
