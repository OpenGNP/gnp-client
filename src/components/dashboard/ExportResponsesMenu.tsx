import { ChevronDown, Download, EyeOff, FileSpreadsheet, FileText } from 'lucide-react'
import { useState } from 'react'

import { downloadFormResponses, type ResponseExportFormat } from '../../api/analytics'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

function exportFileName(title: string | null, format: ResponseExportFormat): string {
  const base = (title ?? '').replace(/[\\/:*?"<>|]+/g, ' ').trim() || 'form'
  return `${base} - responses.${format}`
}

export function ExportResponsesMenu({
  formId,
  formTitle,
  includeNames,
}: {
  formId: number
  formTitle: string | null
  /** Off while "Show names" is off — the file leaves out the Respondent column. */
  includeNames: boolean
}) {
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)

  const download = async (format: ResponseExportFormat) => {
    setPending(true)
    setFailed(false)
    try {
      const blob = await downloadFormResponses(formId, format, includeNames)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = exportFileName(formTitle, format)
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
          <DropdownMenuItem onSelect={() => void download('xlsx')}>
            <FileSpreadsheet size={14} />
            Excel (.xlsx)
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void download('csv')}>
            <FileText size={14} />
            CSV (.csv)
          </DropdownMenuItem>
          {includeNames ? null : (
            <>
              <DropdownMenuSeparator />
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
