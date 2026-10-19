import { useQuery } from '@tanstack/react-query'
import { FileText, Folder, Search, Users } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { sharedFormsQuery } from '../../api/queries'
import type { ProjectTreeItem } from '../../data/dashboard'
import { cn } from '../../lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog'

const MAX_PER_GROUP = 6
const MAX_RECENT = 5

/** A hit: one of my folders / forms, or a form shared with me. */
export type SearchResult =
  | { kind: 'folder' | 'form'; item: ProjectTreeItem; label: string; path: string }
  | { kind: 'shared'; urlId: string; label: string; path: string }

type Group = { title: string; icon: typeof Folder; results: SearchResult[] }

const ICONS = { folder: Folder, form: FileText, shared: Users }

/** My folders and forms (whose name contains `term`, or all of them), each with the folders above it. */
function flattenTree(items: ProjectTreeItem[], term: string, parents: string[] = []): SearchResult[] {
  return items.flatMap((item) => {
    const path = ['My Project', ...parents].join(' › ')
    const hit: SearchResult[] = item.label.toLowerCase().includes(term)
      ? [{ kind: item.type === 'folder' ? 'folder' : 'form', item, label: item.label, path }]
      : []
    return [...hit, ...flattenTree(item.children ?? [], term, [...parents, item.label])]
  })
}

/** Every case-insensitive match of `term` in `label`, highlighted. */
function Highlighted({ label, term }: { label: string; term: string }) {
  if (!term) return <>{label}</>
  const parts: ReactNode[] = []
  const lower = label.toLowerCase()
  let cursor = 0
  let match = lower.indexOf(term)
  while (match !== -1) {
    if (match > cursor) parts.push(label.slice(cursor, match))
    parts.push(
      <mark className="rounded-[2px] bg-[#ffe9a8] text-inherit" key={match}>
        {label.slice(match, match + term.length)}
      </mark>,
    )
    cursor = match + term.length
    match = lower.indexOf(term, cursor)
  }
  if (cursor < label.length) parts.push(label.slice(cursor))
  return <>{parts}</>
}

/**
 * Spotlight-style search, centred over the page: my folders and forms plus forms shared
 * with me, by name, from data already loaded. Empty, it lists recently opened forms.
 */
export function SearchDialog({
  open,
  onOpenChange,
  projects,
  onOpenResult,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  projects: ProjectTreeItem[]
  onOpenResult: (result: SearchResult) => void
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      {/* Near the top, like Spotlight, so the list has room to grow downwards. */}
      <DialogContent className="top-[15vh] w-150 max-w-[calc(100vw-32px)] translate-y-0 overflow-hidden rounded-[14px] border border-[#e8eaf1] bg-white p-0 shadow-[0_24px_64px_rgba(15,23,42,0.28)]">
        <DialogTitle className="sr-only">Search</DialogTitle>
        <DialogDescription className="sr-only">Find a form or folder by name.</DialogDescription>
        {/* Remounts on every open, so it starts empty. */}
        {open ? (
          <SearchPanel
            onChoose={(result) => {
              onOpenChange(false)
              onOpenResult(result)
            }}
            projects={projects}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function SearchPanel({
  projects,
  onChoose,
}: {
  projects: ProjectTreeItem[]
  onChoose: (result: SearchResult) => void
}) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const shared = useQuery(sharedFormsQuery()).data ?? []
  const term = query.trim().toLowerCase()

  let groups: Group[]
  if (term) {
    const mine = flattenTree(projects, term)
    const sharedHits: SearchResult[] = shared
      .filter((form) => (form.formTitle ?? 'Untitled form').toLowerCase().includes(term))
      .map((form) => ({
        kind: 'shared',
        urlId: form.urlId,
        label: form.formTitle ?? 'Untitled form',
        path: form.ownerName ? `Shared by ${form.ownerName}` : 'Shared with me',
      }))
    groups = [
      { title: 'Folders', icon: Folder, results: mine.filter((result) => result.kind === 'folder') },
      { title: 'Forms', icon: FileText, results: mine.filter((result) => result.kind === 'form') },
      { title: 'Shared with me', icon: Users, results: sharedHits },
    ]
  } else {
    const openedAt = (result: SearchResult) => (result.kind === 'shared' ? '' : (result.item.lastOpenedAt ?? ''))
    const recent = flattenTree(projects, '')
      .filter((result) => result.kind === 'form' && openedAt(result))
      .sort((a, b) => openedAt(b).localeCompare(openedAt(a)))
    groups = [{ title: 'Recent', icon: FileText, results: recent.slice(0, MAX_RECENT) }]
  }
  groups = groups
    .map((group) => ({ ...group, results: group.results.slice(0, MAX_PER_GROUP) }))
    .filter((group) => group.results.length > 0)
  // In display order, so ↑ / ↓ walk the list as it's shown.
  const results = groups.flatMap((group) => group.results)

  return (
    <div className="flex flex-col">
      <div className="flex h-14 items-center gap-3 border-b border-[#eef0f4] px-4.5 text-[#6e7180]">
        <Search className="shrink-0" size={20} />
        <input
          aria-activedescendant={results[active] ? `search-result-${active}` : undefined}
          aria-autocomplete="list"
          aria-controls="search-results"
          aria-expanded={results.length > 0}
          aria-label="Search forms and folders"
          autoFocus
          className="min-w-0 flex-1 border-0 bg-transparent text-[16px] text-[#14181f] outline-0 placeholder:text-[#9a9ca5] [&::-webkit-search-cancel-button]:hidden"
          onChange={(event) => {
            setQuery(event.target.value)
            setActive(0)
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              if (results.length === 0) return
              event.preventDefault()
              const step = event.key === 'ArrowDown' ? 1 : -1
              setActive((current) => (current + step + results.length) % results.length)
            } else if (event.key === 'Enter' && results[active]) {
              event.preventDefault()
              onChoose(results[active])
            }
          }}
          placeholder="Search forms and folders…"
          role="combobox"
          type="search"
          value={query}
        />
      </div>

      <div className="max-h-[min(420px,60vh)] overflow-y-auto py-1.5" id="search-results" role="listbox">
        {results.length === 0 ? (
          <p className="m-0 px-4.5 py-6 text-center text-[13px] text-[#726f6f]">
            {term ? `No results for “${query.trim()}”` : 'Type to search your forms and folders.'}
          </p>
        ) : (
          groups.map((group) => (
            <div aria-label={group.title} key={group.title} role="group">
              <p className="m-0 px-4.5 pt-2 pb-1 text-[11px] font-semibold tracking-[0.3px] text-[#929292] uppercase">
                {group.title}
              </p>
              {group.results.map((result) => {
                const index = results.indexOf(result)
                const Icon = ICONS[result.kind]
                return (
                  <div
                    aria-selected={index === active}
                    className={cn(
                      'mx-1.5 flex cursor-pointer items-center gap-3 rounded-[8px] px-3 py-2',
                      index === active && 'bg-[#edf2fd]',
                    )}
                    id={`search-result-${index}`}
                    key={result.kind === 'shared' ? `shared-${result.urlId}` : result.item.id}
                    onClick={() => onChoose(result)}
                    onMouseMove={() => setActive(index)}
                    role="option"
                  >
                    <Icon className={cn('shrink-0', index === active ? 'text-[#1e55c5]' : 'text-[#6e7180]')} size={18} />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-[14px] text-[#14181f]">
                        <Highlighted label={result.label} term={term} />
                      </span>
                      <span className="truncate text-[12px] text-[#929292]">{result.path}</span>
                    </span>
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>

      <div className="flex items-center gap-4 border-t border-[#eef0f4] px-4.5 py-2 text-[11px] text-[#929292] max-[560px]:hidden">
        <span>
          <Kbd>↑</Kbd> <Kbd>↓</Kbd> to move
        </span>
        <span>
          <Kbd>↵</Kbd> to open
        </span>
        <span>
          <Kbd>esc</Kbd> to close
        </span>
      </div>
    </div>
  )
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-[#e0e2e7] bg-[#f7f8fb] px-1 font-sans text-[10px] font-semibold text-[#6e7180]">
      {children}
    </kbd>
  )
}
