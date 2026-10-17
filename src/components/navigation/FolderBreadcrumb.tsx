import { ChevronRight } from 'lucide-react'
import { Fragment } from 'react'
import { Link } from 'react-router-dom'

const MAX_VISIBLE = 3

const crumbClass = 'rounded px-1 py-0.5 text-[#726f6f] hover:bg-[#eef2fb] hover:text-[#1e55c5]'

/** Where a form lives — "My Project › Folder › Subfolder", each linking to the Files page. Just "My Project" at the root. */
export function FolderBreadcrumb({ path }: { path: { id: string; label: string }[] }) {
  // Deep paths keep their outermost and innermost folders: "My Project › A › … › Y › Z".
  const visible =
    path.length > MAX_VISIBLE ? [path[0]!, null, ...path.slice(-(MAX_VISIBLE - 1))] : path

  return (
    <nav aria-label="Folder" className="-mb-3 flex flex-wrap items-center gap-0.5 text-[13px]">
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
