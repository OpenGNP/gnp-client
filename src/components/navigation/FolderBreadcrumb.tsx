import { ChevronRight } from 'lucide-react'
import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { cn } from '../../lib/utils'

const MAX_VISIBLE = 3

const crumbClass = 'rounded px-1 py-0.5 text-[#726f6f] hover:bg-[#eef2fb] hover:text-[#1e55c5]'

/** Where a form lives — "My Project › Folder › Subfolder", each linking to the Files page. Just "My Project" at the root. */
export function FolderBreadcrumb({
  path,
  className,
}: {
  path: { id: string; label: string }[]
  className?: string
}) {
  // Deep paths keep their outermost and innermost folders: "My Project › A › … › Y › Z".
  const visible =
    path.length > MAX_VISIBLE ? [path[0]!, null, ...path.slice(-(MAX_VISIBLE - 1))] : path

  return (
    <nav aria-label="Folder" className={cn('flex min-w-0 flex-wrap items-center gap-0.5 text-[13px]', className)}>
      <Link className={crumbClass} to="/files">
        My Project
      </Link>
      {visible.map((folder, index) => (
        <Fragment key={folder?.id ?? `gap-${index}`}>
          <ChevronRight className="shrink-0 text-[#b0b1b3]" size={14} />
          {folder ? (
            <Link className={crumbClass} to={`/files/${encodeURIComponent(folder.id)}`}>
              {folder.label}
            </Link>
          ) : (
            <span className="px-1 text-[#929292]">…</span>
          )}
        </Fragment>
      ))}
    </nav>
  )
}

/**
 * The block under a form's Edit form | Dashboard bar: breadcrumb left, the page's
 * actions right, both on one 38px line in the same spot on every page, so switching
 * pages never moves them. `heading` (the dashboard's form name) sits under the breadcrumb.
 */
export function FolderBreadcrumbBar({
  path,
  actions,
  heading,
}: {
  path: { id: string; label: string }[]
  actions?: ReactNode
  heading?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 bg-[#f5f9ff] px-10 py-5 max-[900px]:px-6 max-[560px]:px-4">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-9.5 items-center">
          <FolderBreadcrumb path={path} />
        </div>
        {heading}
      </div>
      {actions ? <div className="ml-auto flex h-9.5 shrink-0 items-center gap-2.5">{actions}</div> : null}
    </div>
  )
}
