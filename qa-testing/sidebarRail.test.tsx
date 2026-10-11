import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'

import { Sidebar } from '../src/components/navigation/Sidebar'
import { brand } from '../src/data/dashboard'

function Harness() {
  const [collapsed, setCollapsed] = useState(true)
  const [search, setSearch] = useState('')
  return (
    <Sidebar
      activeNav="files"
      brand={brand}
      isCollapsed={collapsed}
      openFolderIds={new Set()}
      projects={[{ id: 'form-1', formId: '1', label: 'Canteen survey', type: 'document' }]}
      searchTerm={search}
      selectedNodeId=""
      user={{ name: 'Admin', email: 'admin@example.com' }}
      onCreateFolder={() => {}}
      onCreateForm={() => {}}
      onGoFiles={() => {}}
      onGoHome={() => {}}
      onLogout={() => {}}
      onMoveProject={() => {}}
      onSearchChange={setSearch}
      onSelectProject={() => {}}
      onToggleCollapse={() => setCollapsed((value) => !value)}
      onToggleFolder={() => {}}
    />
  )
}

describe('collapsed sidebar rail', () => {
  it('shows icon shortcuts with the current page marked, and no project tree', () => {
    render(<Harness />)
    expect(screen.getByRole('button', { name: 'Files' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Home' })).not.toHaveAttribute('aria-current')
    expect(screen.queryByText('Canteen survey')).not.toBeInTheDocument()
  })

  it('Search expands the sidebar and focuses the search box', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Search' }))
    expect(screen.getByRole('searchbox', { name: 'Search forms' })).toHaveFocus()
    expect(screen.getByText('Canteen survey')).toBeInTheDocument()
  })

  it('Create → Create folder expands straight into the new-folder row', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Create' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Create folder' }))
    expect(await screen.findByRole('textbox', { name: 'Folder name' })).toBeInTheDocument()
  })

  it('the expand button opens the full sidebar without side effects', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Expand sidebar' }))
    expect(screen.getByRole('searchbox', { name: 'Search forms' })).not.toHaveFocus()
    expect(screen.queryByRole('textbox', { name: 'Folder name' })).not.toBeInTheDocument()
  })

  it('pressing / while collapsed opens the sidebar and focuses search', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.keyboard('/')
    expect(screen.getByRole('searchbox', { name: 'Search forms' })).toHaveFocus()
    // the "/" itself isn't typed into the box
    expect(screen.getByRole('searchbox', { name: 'Search forms' })).toHaveValue('')
  })
})
