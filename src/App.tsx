import { useState } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'

import { CreateFormNavbar } from './components/navigation/CreateFormNavbar'
import { Navbar } from './components/navigation/Navbar'
import { SaveDraftModal } from './components/navigation/SaveDraftModal'
import { Sidebar } from './components/navigation/Sidebar'
import { brand, projectTree, user, type ProjectTreeItem } from './data/dashboard'
import { useFormAccessSettings } from './hooks/useFormAccessSettings'
import { useProjectTree } from './hooks/useProjectTree'
import { CreateFormPage } from './pages/CreateFormPage'
import { EditFormPage } from './pages/EditFormPage'
import { FilesPage } from './pages/FilesPage'
import { FormDashboardPage } from './pages/FormDashboardPage'
import { HomePage } from './pages/HomePage'
import { getSelectedProjectId } from './utils/projectTree'

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    projects,
    openFolderIds,
    addProject,
    addFolder,
    moveProject,
    removeProject,
    renameProject,
    toggleFolder,
  } = useProjectTree(projectTree)
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
  } = useFormAccessSettings()
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
    navigate('/create-form')
  }

  function handleCreateFormInFolder(folderId: string | null) {
    const newFormId = crypto.randomUUID()

    addProject(folderId, {
      id: newFormId,
      label: 'Untitled form',
      type: 'document',
      formId: newFormId,
    })

    setIsCreateFormSettingsOpen(false)
    navigate(`/forms/${encodeURIComponent(newFormId)}`)
  }

  function handleSelectProject(project: ProjectTreeItem) {
    setIsCreateFormSettingsOpen(false)
    navigate(`/forms/${encodeURIComponent(project.id)}`)
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

    const newFormId = crypto.randomUUID()

    addProject(folderId, {
      id: newFormId,
      label: 'Untitled form',
      type: 'document',
      formId: newFormId,
    })

    setIsCreateFormSettingsOpen(false)
    navigate(`/forms/${encodeURIComponent(newFormId)}`)
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
          user={user}
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
            isSettingsOpen={isCreateFormSettingsOpen}
            onGoHome={handleGoHome}
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
                onCloseSettings={() => setIsCreateFormSettingsOpen(false)}
                onUpdateFormAccessSettings={onUpdateCreateFormAccessSettings}
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
