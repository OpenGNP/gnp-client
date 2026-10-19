import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { vi } from 'vitest'

import { Sidebar } from '../src/components/navigation/Sidebar'
import { queryKeys } from '../src/api/queries'
import { brand, type ProjectTreeItem } from '../src/data/dashboard'

const projects: ProjectTreeItem[] = [
  {
    id: 'f1',
    label: 'Canteen',
    type: 'folder',
    children: [{ id: 'form-1', formId: '1', urlId: 'abc', label: 'Canteen survey', type: 'document' }],
  },
]

function Harness({ onSelectProject = () => {}, onOpenSharedForm = () => {} }: {
  onSelectProject?: (item: ProjectTreeItem) => void
  onOpenSharedForm?: (urlId: string) => void
}) {
  const [collapsed, setCollapsed] = useState(true)
  return (
    <Sidebar
      activeNav="files"
      brand={brand}
      isCollapsed={collapsed}
      openFolderIds={new Set()}
      projects={projects}
      selectedNodeId=""
      user={{ name: 'Admin', email: 'admin@example.com' }}
      onCreateFolder={() => {}}
      onCreateForm={() => {}}
      onGoFiles={() => {}}
      onGoHome={() => {}}
      onLogout={() => {}}
      onMoveProject={() => {}}
      onOpenSharedForm={onOpenSharedForm}
      onSelectProject={onSelectProject}
      onToggleCollapse={() => setCollapsed((value) => !value)}
      onToggleFolder={() => {}}
    />
  )
}

function renderSidebar(props: Parameters<typeof Harness>[0] = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } })
  client.setQueryData(queryKeys.sharedForms, [{ id: 9, urlId: 'xyz', formTitle: 'Canteen prices', ownerName: 'Somchai' }])
  return render(
    <QueryClientProvider client={client}>
      <Harness {...props} />
    </QueryClientProvider>,
  )
}

describe('collapsed sidebar rail', () => {
  it('shows icon shortcuts with the current page marked, and no project tree', () => {
    renderSidebar()
    expect(screen.getByRole('button', { name: 'Files' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Home' })).not.toHaveAttribute('aria-current')
    expect(screen.queryByText('Canteen survey')).not.toBeInTheDocument()
  })

  it('Search opens the search dialog without expanding the sidebar', async () => {
    const user = userEvent.setup()
    renderSidebar()
    await user.click(screen.getByRole('button', { name: 'Search' }))
    expect(screen.getByRole('combobox', { name: 'Search forms and folders' })).toHaveFocus()
    expect(screen.queryByRole('button', { name: 'Collapse sidebar' })).not.toBeInTheDocument()
  })

  it('finds my folders and forms (with their path) and forms shared with me', async () => {
    const user = userEvent.setup()
    renderSidebar()
    await user.keyboard('/')
    await user.keyboard('canteen')
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'CanteenMy Project',
      'Canteen surveyMy Project › Canteen',
      'Canteen pricesShared by Somchai',
    ])
  })

  it('opens a result with the arrow keys and Enter, then closes', async () => {
    const user = userEvent.setup()
    const onOpenSharedForm = vi.fn()
    renderSidebar({ onOpenSharedForm })
    await user.keyboard('/')
    await user.keyboard('canteen{ArrowDown}{ArrowDown}{Enter}')
    expect(onOpenSharedForm).toHaveBeenCalledWith('xyz')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('"/" works with the Thai layout on too (same key types "ฝ")', () => {
    renderSidebar()
    fireEvent.keyDown(document.body, { key: 'ฝ', code: 'Slash' })
    expect(screen.getByRole('combobox', { name: 'Search forms and folders' })).toBeInTheDocument()
  })

  it('says when nothing matches', async () => {
    const user = userEvent.setup()
    renderSidebar()
    await user.keyboard('/zzz')
    expect(screen.getByText('No results for “zzz”')).toBeInTheDocument()
  })

  it('Create → Create folder expands straight into the new-folder row', async () => {
    const user = userEvent.setup()
    renderSidebar()
    await user.click(screen.getByRole('button', { name: 'Create' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Create folder' }))
    expect(await screen.findByRole('textbox', { name: 'Folder name' })).toBeInTheDocument()
  })

  it('the expand button opens the full sidebar without side effects', async () => {
    const user = userEvent.setup()
    renderSidebar()
    await user.click(screen.getByRole('button', { name: 'Expand sidebar' }))
    expect(screen.getByText('Canteen')).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Folder name' })).not.toBeInTheDocument()
  })
})
