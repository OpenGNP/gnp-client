import { ArrowDown, ArrowUp, ArrowUpDown, Check, ChevronDown } from 'lucide-react'

import { cn } from '../../lib/utils'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import type { SortDir, SortKey } from './sortOptions'

const SORT_LABELS: Record<SortKey, string> = {
  name: 'Name',
  opened: 'Date opened',
  modified: 'Date modified',
  created: 'Date created',
}

/** The Files-style "Sort: … ▾" menu and its direction toggle — sits at the end of a page's title row. */
export function SortControls({
  keys,
  sortKey,
  sortDir,
  onSortKeyChange,
  onSortDirChange,
}: {
  /** Which keys this page offers, in menu order. */
  keys: SortKey[]
  sortKey: SortKey
  sortDir: SortDir
  onSortKeyChange: (key: SortKey) => void
  onSortDirChange: (dir: SortDir) => void
}) {
  return (
    <div className="flex shrink-0 gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-[#e0e2e7] bg-white px-3 py-1.5 text-[13px] font-medium text-[#3c4043] hover:bg-[#f7f8fb]"
            type="button"
          >
            <ArrowUpDown className="text-[#5f6368]" size={14} />
            <span className="text-[#8b8e98]">Sort:</span>
            {SORT_LABELS[sortKey]}
            <ChevronDown className="text-[#5f6368]" size={14} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {keys.map((key) => (
            <DropdownMenuItem key={key} onSelect={() => onSortKeyChange(key)}>
              <Check className={cn(key === sortKey ? 'opacity-100' : 'opacity-0')} size={14} />
              {SORT_LABELS[key]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-[#e0e2e7] bg-white px-2.5 py-1.5 text-[13px] font-medium text-[#3c4043] hover:bg-[#f7f8fb]"
        onClick={() => onSortDirChange(sortDir === 'asc' ? 'desc' : 'asc')}
        title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
        type="button"
      >
        {sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
        {sortKey === 'name' ? (sortDir === 'asc' ? 'A–Z' : 'Z–A') : sortDir === 'asc' ? 'Oldest' : 'Newest'}
      </button>
    </div>
  )
}
