import { ChevronDown, Download, EyeOff, ListFilter, type LucideIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

export type ExportOption = {
  label: string
  icon: LucideIcon
  /** File extension, without the dot. */
  extension: string
  download: () => Promise<Blob>
}

/** "<form title> - <what>.<ext>", without characters file systems reject. */
function exportFileName(title: string | null, what: string, extension: string): string {
  const base = (title ?? '').replace(/[\\/:*?"<>|]+/g, ' ').trim() || 'form'
  return `${base} - ${what}.${extension}`
}

/** A dashboard tab's "Export" dropdown: one item per file format. */
export function ExportMenu({
  options,
  formTitle,
  what,
  includeNames,
  scope,
}: {
  options: ExportOption[]
  formTitle: string | null
  /** Names the file's contents, e.g. "responses" → "Canteen survey - responses.xlsx". */
  what: string
  /** Off while "Show names" is off — the file leaves out respondent names. */
  includeNames: boolean
  /** The filters the file is limited to, one per line, e.g. ["1 Sep – 17 Oct 2026", "Year = 4"]. */
  scope?: string[]
}) {
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)

  const download = async (option: ExportOption) => {
    setPending(true)
    setFailed(false)
    try {
      const blob = await option.download()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = exportFileName(formTitle, what, option.extension)
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      setFailed(true)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {failed ? <span className="text-[12px] text-destructive">Export failed</span> : null}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button disabled={pending} size="sm" variant="outline">
            <Download />
            {pending ? 'Exporting…' : 'Export'}
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {options.map((option) => (
            <DropdownMenuItem key={option.extension} onSelect={() => void download(option)}>
              <option.icon size={14} />
              {option.label}
            </DropdownMenuItem>
          ))}
          {scope?.length || !includeNames ? <DropdownMenuSeparator /> : null}
          {scope?.length ? (
            <p className="m-0 flex max-w-56 items-start gap-1.5 px-3 py-1.5 text-[11px] leading-4 text-[#929292]">
              <ListFilter className="mt-0.5 shrink-0" size={12} />
              <span className="flex flex-col">
                Only what the current filters show:
                {scope.map((filter) => (
                  <span className="font-medium text-[#3f4045]" key={filter}>
                    {filter}
                  </span>
                ))}
              </span>
            </p>
          ) : null}
          {includeNames ? null : (
            <>
              <p className="m-0 flex max-w-56 items-start gap-1.5 px-3 py-1.5 text-[11px] leading-4 text-[#929292]">
                <EyeOff className="mt-0.5 shrink-0" size={12} />
                Names are hidden, so the file won’t include respondent names.
              </p>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
