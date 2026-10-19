import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, RefreshCw, Share2 } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'

import { replaceCollaborators, type ApiCollaborator } from '../../api/forms'
import { collaboratorsQuery, formQuery, formRefQuery, queryKeys } from '../../api/queries'
import { ApiError } from '../../lib/api'
import { cn } from '../../lib/utils'
import { SpecificPeopleField } from '../forms/SpecificPeopleField'
import { MESSAGE_ACTION, MESSAGE_ACTION_STYLES, MESSAGE_DESCRIPTION, MESSAGE_TITLE } from '../messageStyles'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'

/**
 * The form's sharing, top right of its Edit / Dashboard bar: the owner's "Share results"
 * button (with how many can see them), or a viewer's "View only · shared by …".
 * Reads the route's form from the cache both pages already fill.
 */
export function ShareControl() {
  const { projectId: ref = '' } = useParams()
  const formRef = useQuery({ ...formRefQuery(ref), enabled: ref !== '' }).data
  const formId = formRef?.id ?? 0
  const form = useQuery({ ...formQuery(formId), enabled: formId > 0 }).data
  const role = form?.role ?? formRef?.role ?? 'owner'

  if (!formRef) return null
  if (role === 'viewer') {
    const chip = (
      <span className="inline-flex h-8 min-w-0 items-center gap-1.5 rounded-full bg-[#f0f1f4] px-3 text-[12px] font-medium text-[#726f6f]">
        <Eye className="shrink-0" size={14} />
        View only
      </span>
    )
    // Who shared it is on hover — the chip stays short in the bar.
    return form?.ownerName ? (
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>{chip}</TooltipTrigger>
        <TooltipContent side="bottom">
          Shared by {form.ownerName}
          {form.ownerEmail && form.ownerEmail !== form.ownerName ? ` (${form.ownerEmail})` : ''}
        </TooltipContent>
      </Tooltip>
    ) : (
      chip
    )
  }
  return <ShareButton formId={formId} />
}

const MAX_AVATARS = 3
const AVATAR_COLORS = ['#1e55c5', '#0b842d', '#b7791f', '#c1121f', '#6b46c1', '#0e7490']

/** "Somchai Jaidee" → "SJ"; no name → the email's first letter. */
function initialsOf(viewer: ApiCollaborator) {
  const words = (viewer.fullName ?? '').trim().split(/\s+/).filter(Boolean)
  if (words.length > 0) return words.slice(0, 2).map((word) => [...word][0]).join('').toUpperCase()
  return ([...viewer.email][0] ?? '?').toUpperCase()
}

// The same person keeps the same colour everywhere.
function colorOf(email: string) {
  let hash = 0
  for (const char of email.toLowerCase()) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

/** Who can see the results, as overlapping initials — the first few, then "+N". */
function ViewerAvatars({ viewers, onOpen }: { viewers: ApiCollaborator[]; onOpen: () => void }) {
  const shown = viewers.slice(0, MAX_AVATARS)
  const rest = viewers.length - shown.length
  return (
    <button
      aria-label={`Shared with ${viewers.length} ${viewers.length === 1 ? 'person' : 'people'}`}
      className="flex cursor-pointer items-center rounded-full border-0 bg-transparent p-0 max-[560px]:hidden"
      onClick={onOpen}
      type="button"
    >
      {shown.map((viewer) => (
        <Tooltip delayDuration={200} key={viewer.email}>
          <TooltipTrigger asChild>
            <span
              className="-ml-1.5 flex size-7 items-center justify-center rounded-full text-[11px] font-semibold text-white ring-2 ring-white first:ml-0"
              style={{ backgroundColor: colorOf(viewer.email) }}
            >
              {initialsOf(viewer)}
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {viewer.fullName ? `${viewer.fullName} (${viewer.email})` : viewer.email}
          </TooltipContent>
        </Tooltip>
      ))}
      {rest > 0 ? (
        <span className="-ml-1.5 flex size-7 items-center justify-center rounded-full bg-[#eef0f4] text-[11px] font-semibold text-[#3f4045] ring-2 ring-white">
          +{rest}
        </span>
      ) : null}
    </button>
  )
}

function ShareButton({ formId }: { formId: number }) {
  const [open, setOpen] = useState(false)
  const viewers = useQuery(collaboratorsQuery(formId)).data ?? []
  return (
    <>
      <div className="flex items-center gap-2.5">
        {viewers.length > 0 ? <ViewerAvatars onOpen={() => setOpen(true)} viewers={viewers} /> : null}
        {/* Its own compact button: the top bar is navigation, so it stays lighter than the page actions. */}
        <button
          data-tour="share-results"
          aria-label={viewers.length > 0 ? `Share results (shared with ${viewers.length})` : 'Share results'}
          className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[10px] border border-[#d2d8e5] bg-white px-3 text-[13px] font-semibold text-[#3f4045] transition-colors hover:bg-[#f7f8fb] max-[560px]:size-8 max-[560px]:justify-center max-[560px]:px-0"
          onClick={() => setOpen(true)}
          type="button"
        >
          <Share2 className="shrink-0" size={15} strokeWidth={2.2} />
          <span className="max-[560px]:sr-only">Share results</span>
        </button>
      </div>
      {open ? <ShareDialog formId={formId} onClose={() => setOpen(false)} /> : null}
    </>
  )
}

function ShareDialog({ formId, onClose }: { formId: number; onClose: () => void }) {
  const queryClient = useQueryClient()
  const saved = useQuery(collaboratorsQuery(formId))
  // null until edited: the list shows what's saved until the owner changes it.
  const [draft, setDraft] = useState<string[] | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const emails = draft ?? saved.data?.map((viewer) => viewer.email) ?? []

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const next = await replaceCollaborators(formId, emails)
      queryClient.setQueryData(queryKeys.collaborators(formId), next)
      onClose()
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : 'Could not update sharing. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog onOpenChange={(next) => (!next && !saving ? onClose() : undefined)} open>
      <DialogContent className="w-120 max-w-[calc(100vw-32px)] rounded-[10px] border border-[#e8eaf1] bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
        <DialogTitle className={MESSAGE_TITLE}>Share results</DialogTitle>
        <DialogDescription className={cn(MESSAGE_DESCRIPTION, 'mt-1')}>
          People you add can view and export the results, but can’t edit, share or delete the form.
        </DialogDescription>

        {saved.isPending ? (
          <p className="m-0 mt-4 flex items-center gap-2 text-[13px] text-[#726f6f]">
            <RefreshCw className="animate-spin" size={14} />
            Loading…
          </p>
        ) : saved.isError ? (
          <p className="m-0 mt-4 text-[13px] text-destructive">Could not load who this form is shared with.</p>
        ) : (
          <div className={cn(saving && 'opacity-60')} inert={saving}>
            <SpecificPeopleField emails={emails} onChange={setDraft} />
          </div>
        )}

        {error ? <p className="m-0 mt-3 text-[12px] text-destructive">{error}</p> : null}

        <div className="mt-5 flex justify-end gap-2">
          <button
            className={cn(MESSAGE_ACTION, MESSAGE_ACTION_STYLES.secondary)}
            disabled={saving}
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className={cn(MESSAGE_ACTION, MESSAGE_ACTION_STYLES.primary, 'gap-1.5 disabled:opacity-60')}
            disabled={saving || !saved.isSuccess || draft === null}
            onClick={() => void save()}
            type="button"
          >
            {saving ? <RefreshCw className="animate-spin" size={14} /> : null}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
