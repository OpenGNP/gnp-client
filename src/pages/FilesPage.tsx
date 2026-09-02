import { ChevronRight, FileText, Folder } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { PageContainer } from '../components/layout/PageContainer'
import type { ProjectTreeItem } from '../data/dashboard'
import { cn } from '../lib/utils'
import { getFolderPath } from '../utils/projectTree'

export type FilesPageProps = {
  projects: ProjectTreeItem[]
}

function ItemCard({
  item,
  onOpen,
}: {
  item: ProjectTreeItem
  onOpen: (item: ProjectTreeItem) => void
}) {
  const isFolder = item.type === 'folder'
  const Icon = isFolder ? Folder : FileText

  return (
    <button
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-[10px] border border-[#e9eaed] px-4 py-3.5 text-left transition-colors',
        isFolder ? 'bg-[#f7f8fb] hover:bg-[#eef1f7]' : 'bg-white hover:bg-[#f7f8fb]',
      )}
      onClick={() => onOpen(item)}
      type="button"
    >
      <Icon
        className={cn('shrink-0', isFolder ? 'text-[#5f6368]' : 'text-[#1e55c5]')}
        size={22}
      />
      <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-[#3c4043]">
        {item.label}
      </span>
    </button>
  )
}

export function FilesPage({ projects }: FilesPageProps) {
  const navigate = useNavigate()
  const { folderId } = useParams()

  const path = folderId ? getFolderPath(projects, folderId) : []
  const currentFolder = path.length > 0 ? path[path.length - 1] : null
  const items = currentFolder?.children ?? projects

  const folders = items.filter((item) => item.type === 'folder')
  const files = items.filter((item) => item.type === 'document')

  function openItem(item: ProjectTreeItem) {
    if (item.type === 'folder') {
      navigate(`/files/${encodeURIComponent(item.id)}`)
    } else {
      navigate(`/forms/${encodeURIComponent(item.id)}`)
    }
  }

  return (
    <PageContainer>
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-0.5 pt-8 pb-1 text-[22px] text-[#3c4043]"
      >
        <button
          className="cursor-pointer rounded px-1.5 py-1 font-medium hover:bg-[#f7f8fb] disabled:cursor-default disabled:font-semibold disabled:hover:bg-transparent"
          disabled={path.length === 0}
          onClick={() => navigate('/files')}
          type="button"
        >
          My Project
        </button>
        {path.map((folder, index) => {
          const isLast = index === path.length - 1

          return (
            <span className="flex items-center gap-0.5" key={folder.id}>
              <ChevronRight className="shrink-0 text-[#b0b1b3]" size={18} />
              <button
                className={cn(
                  'cursor-pointer rounded px-1.5 py-1 hover:bg-[#f7f8fb] disabled:cursor-default disabled:hover:bg-transparent',
                  isLast ? 'font-semibold' : 'text-[#1e55c5]',
                )}
                disabled={isLast}
                onClick={() => navigate(`/files/${encodeURIComponent(folder.id)}`)}
                type="button"
              >
                {folder.label}
              </button>
            </span>
          )
        })}
      </nav>

      {folders.length === 0 && files.length === 0 ? (
        <p className="mt-12 text-[14px] text-[#8b8e98]">This folder is empty.</p>
      ) : (
        <div className="mt-6 flex flex-col gap-8">
          {folders.length > 0 ? (
            <section aria-labelledby="files-folders-heading">
              <h2
                className="m-0 mb-3 text-[13px] font-semibold tracking-[0.13px] text-[#5f6368]"
                id="files-folders-heading"
              >
                Folders
              </h2>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
                {folders.map((folder) => (
                  <ItemCard item={folder} key={folder.id} onOpen={openItem} />
                ))}
              </div>
            </section>
          ) : null}

          {files.length > 0 ? (
            <section aria-labelledby="files-files-heading">
              <h2
                className="m-0 mb-3 text-[13px] font-semibold tracking-[0.13px] text-[#5f6368]"
                id="files-files-heading"
              >
                Files
              </h2>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
                {files.map((file) => (
                  <ItemCard item={file} key={file.id} onOpen={openItem} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </PageContainer>
  )
}
