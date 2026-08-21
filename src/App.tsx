import { useState } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'

import { CreateFormNavbar } from './components/navigation/CreateFormNavbar'
import { Navbar } from './components/navigation/Navbar'
import { Sidebar } from './components/navigation/Sidebar'
import { brand, projectTree, user, type ProjectTreeItem } from './data/dashboard'
import { useProjectTree } from './hooks/useProjectTree'
import { CreateFormPage } from './pages/CreateFormPage'
import { FormBlankPage } from './pages/FormBlankPage'
import { HomePage } from './pages/HomePage'
import { getSelectedProjectId } from './utils/projectTree'

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const { projects, openFolderIds, moveProject, toggleFolder } =
    useProjectTree(projectTree)
  const [searchTerm, setSearchTerm] = useState('')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isCreateFormSettingsOpen, setIsCreateFormSettingsOpen] =
    useState(false)
  const selectedProjectId = getSelectedProjectId(location.pathname)
  const isCreateFormRoute = location.pathname === '/create-form'

  function handleGoHome() {
    setIsCreateFormSettingsOpen(false)
    navigate('/')
  }

  function handleCreateForm() {
    setIsCreateFormSettingsOpen(false)
    navigate('/create-form')
  }

  function handleSelectProject(project: ProjectTreeItem) {
    setIsCreateFormSettingsOpen(false)
    navigate(`/forms/${encodeURIComponent(project.id)}`)
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
          onCreateForm={handleCreateForm}
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
            isSettingsOpen={isCreateFormSettingsOpen}
            onGoHome={handleGoHome}
            onToggleSettings={() =>
              setIsCreateFormSettingsOpen((currentValue) => !currentValue)
            }
          />
        ) : (
          <Navbar
            title="Overview"
            showSidebarToggle={isSidebarCollapsed}
            onToggleSidebar={() => setIsSidebarCollapsed(false)}
          />
        )}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/create-form"
            element={
              <CreateFormPage
                showSettings={isCreateFormSettingsOpen}
                onCloseSettings={() => setIsCreateFormSettingsOpen(false)}
              />
            }
          />
          <Route path="/forms/:projectId" element={<FormBlankPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
