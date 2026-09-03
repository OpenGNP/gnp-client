import { ChevronRight, FilePlus, Folder, FolderOpen, FolderPlus } from 'lucide-react'
import {
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { FormCard } from '../components/forms/FormCard'
import { PageContainer } from '../components/layout/PageContainer'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '../components/ui/context-menu'
import { recentForms } from '../data/dashboard'
import type { ProjectTreeItem } from '../data/dashboard'
import { cn } from '../lib/utils'
import { getFolderPath } from '../utils/projectTree'

export type FilesPageProps = {
  projects: ProjectTreeItem[]
  onCreateFolder: (name: string, parentFolderId: string | null) => void
  onCreateForm: (parentFolderId: string | null) => void
  onDeleteItem: (id: string) => void
}

const recentFormsById = new Map(recentForms.map((form) => [form.id, form]))
const FALLBACK_IMAGE = recentForms[recentForms.length - 1].image

const cardBaseClass =
  'flex items-center gap-3 rounded-[10px] border border-[#e9eaed] bg-[#f7f8fb] px-4 py-3.5'

function stopContextMenu(event: { stopPropagation: () => void }) {
  // Keep the page's "new file / new folder" menu to genuine white space only.
  event.stopPropagation()
}

function FolderCard({
  folder,
  onOpen,
}: {
  folder: ProjectTreeItem
  onOpen: () => void
}) {
  return (
    <button
      className={cn(cardBaseClass, 'cursor-pointer text-left transition-colors hover:bg-[#eef1f7]')}
      onClick={onOpen}
      onContextMenu={stopContextMenu}
      type="button"
    >
      <Folder className="shrink-0 text-[#5f6368]" size={22} />
      <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-[#3c4043]">
        {folder.label}
      </span>
    </button>
  )
}

function NewFolderCard({
  onCommit,
  onCancel,
}: {
  onCommit: (name: string) => void
  onCancel: () => void
}) {
  const [value, setValue] = useState('')
  const isDoneRef = useRef(false)
  const hasFocusedRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const focus = () => inputRef.current?.focus()
    focus()
    const frame = requestAnimationFrame(focus)
    return () => cancelAnimationFrame(frame)
  }, [])

  function commit() {
    if (isDoneRef.current) {
      return
    }
    isDoneRef.current = true

    const trimmed = value.trim()
    if (trimmed) {
      onCommit(trimmed)
    } else {
      onCancel()
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      commit()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      isDoneRef.current = true
      onCancel()
    }
  }

  return (
    <div className={cardBaseClass} onContextMenu={stopContextMenu}>
      <FolderOpen className="shrink-0 text-[#1e55c5]" size={22} />
      <input
        aria-label="Folder name"
        className="min-w-0 flex-1 border-0 bg-transparent text-[14px] font-medium text-[#3c4043] outline-0 placeholder:text-[#8a8d97]"
        onBlur={() => {
          if (hasFocusedRef.current) {
            commit()
          }
        }}
        onChange={(event) => setValue(event.target.value)}
        onFocus={() => {
          hasFocusedRef.current = true
        }}
        onKeyDown={handleKeyDown}
        placeholder="Folder name"
        ref={inputRef}
      />
    </div>
  )
}

export function FilesPage({
  projects,
  onCreateFolder,
  onCreateForm,
  onDeleteItem,
}: FilesPageProps) {
  const navigate = useNavigate()
  const { folderId } = useParams()
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)

  const path = folderId ? getFolderPath(projects, folderId) : []
  const currentFolder = path.length > 0 ? path[path.length - 1] : null
  const currentFolderId = currentFolder?.id ?? null
  // Inside a resolved folder we always show ITS contents (empty when it has no
  // children); only the true root falls back to the top-level project list.
  const items = currentFolder ? (currentFolder.children ?? []) : projects

  const folders = items.filter((item) => item.type === 'folder')
  const files = items.filter((item) => item.type === 'document')

  function openFolder(id: string) {
    navigate(`/files/${encodeURIComponent(id)}`)
  }

  function openForm(id: string) {
    navigate(`/forms/${encodeURIComponent(id)}`)
  }

  function deleteFile(file: ProjectTreeItem) {
    if (window.confirm(`Delete "${file.label}"? This can't be undone.`)) {
      onDeleteItem(file.id)
    }
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="min-h-[calc(100vh-50px)]">
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
                      onClick={() => openFolder(folder.id)}
                      type="button"
                    >
                      {folder.label}
                    </button>
                  </span>
                )
              })}
            </nav>

            <div className="mt-6 flex flex-col gap-8">
              {folders.length > 0 || isCreatingFolder ? (
                <section aria-labelledby="files-folders-heading">
                  <h2
                    className="m-0 mb-3 text-[13px] font-semibold tracking-[0.13px] text-[#5f6368]"
                    id="files-folders-heading"
                  >
                    Folders
                  </h2>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
                    {isCreatingFolder ? (
                      <NewFolderCard
                        onCancel={() => setIsCreatingFolder(false)}
                        onCommit={(name) => {
                          onCreateFolder(name, currentFolderId)
                          setIsCreatingFolder(false)
                        }}
                      />
                    ) : null}
                    {folders.map((folder) => (
                      <FolderCard
                        folder={folder}
                        key={folder.id}
                        onOpen={() => openFolder(folder.id)}
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              <section aria-labelledby="files-files-heading">
                <h2
                  className="m-0 mb-3 text-[13px] font-semibold tracking-[0.13px] text-[#5f6368]"
                  id="files-files-heading"
                >
                  Files
                </h2>
                {files.length > 0 ? (
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(min(235px,100%),235px))] gap-x-8 gap-y-5.25 max-[560px]:grid-cols-1">
                    {files.map((file) => {
                      const recentForm = recentFormsById.get(file.formId ?? file.id)

                      return (
                        <div key={file.id} onContextMenu={stopContextMenu}>
                          <FormCard
                            image={recentForm?.image ?? FALLBACK_IMAGE}
                            onDelete={() => deleteFile(file)}
                            onOpen={() => openForm(file.id)}
                            title={file.label}
                            updatedAt={recentForm?.updatedAt ?? '—'}
                          />
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="m-0 text-[14px] text-[#8b8e98]">No file here</p>
                )}
              </section>
            </div>
          </PageContainer>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent onCloseAutoFocus={(event) => event.preventDefault()}>
        <ContextMenuItem
          onSelect={() => {
            setIsCreatingFolder(true)
          }}
        >
          <FolderPlus size={16} />
          New folder
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => onCreateForm(currentFolderId)}>
          <FilePlus size={16} />
          New form
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
