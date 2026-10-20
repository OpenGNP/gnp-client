import { ChevronDown, Download, EyeOff, ListFilter, RefreshCw, type LucideIcon } from 'lucide-react'
import { useState } from 'react'

import { FormActionButton } from '../navigation/FormActionBar'
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
  /** What's in the file, so it's clear before downloading. */
  description?: string
} & (
  | {
      /** File extension, without the dot. */
      extension: string
      download: () => Promise<Blob>
    }
  /** Not a download, e.g. opening the print dialog for a PDF report. */
  | { run: () => void }
)

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
  disabled = false,
  heading,
}: {
  options: ExportOption[]
  formTitle: string | null
  /** Names the file's contents, e.g. "responses" → "Canteen survey - responses.xlsx". */
  what: string
  /** Off while "Show names" is off — the file leaves out respondent names. */
  includeNames: boolean
  /** The filters the file is limited to, one per line, e.g. ["1 Sep – 17 Oct 2026", "Year = 4"]. */
  scope?: string[]
  /** e.g. while showing sample data — there's nothing real to export. */
  disabled?: boolean
  /** One line atop the menu: what the files from this tab are about. */
  heading?: string
}) {
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)

  const download = async (option: ExportOption) => {
    if ('run' in option) {
      option.run()
      return
    }
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
          {/* The dashboard's main action, so the one filled button in its row. */}
          <FormActionButton
            className="bg-[#1e55c5] hover:bg-[#1a49aa] disabled:hover:bg-[#1e55c5]"
            data-tour="export"
            disabled={pending || disabled}
            icon={
              pending ? (
                <RefreshCw className="animate-spin" size={18} strokeWidth={2.2} />
              ) : (
                <Download size={18} strokeWidth={2.2} />
              )
            }
          >
            <span className="inline-flex items-center gap-1">
              {pending ? 'Exporting…' : 'Export'}
              <ChevronDown size={16} />
            </span>
          </FormActionButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-w-72">
          {heading ? (
            <>
              <p className="m-0 px-3 pt-2 pb-1.5 text-[12px] font-semibold text-[#3f4045]">{heading}</p>
              <DropdownMenuSeparator />
            </>
          ) : null}
          {options.map((option) => (
            <DropdownMenuItem
              className="items-start"
              key={option.label}
              onSelect={() => void download(option)}
            >
              <option.icon className="mt-0.5" size={14} />
              <span className="flex flex-col">
                {option.label}
                {option.description ? (
                  <span className="text-[11px] leading-4 text-[#929292]">{option.description}</span>
                ) : null}
              </span>
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
