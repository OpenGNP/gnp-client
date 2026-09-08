import { CalendarClock, Eye, Link2, MessageSquareText, PencilLine, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'

import { SpecificPeopleField } from '../forms/SpecificPeopleField'
import {
  formAccessSettingsChanged,
  type FormAccessSettings,
  type WhoCanFillValue,
} from '../../hooks/useFormAccessSettings'
import { useNow } from '../../hooks/useNow'
import { cn } from '../../lib/utils'
import {
  deriveResponseState,
  describeResponseState,
  formatDateTime,
  scheduleSummary,
} from '../../lib/responseWindow'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { PopoverClose } from '../ui/popover'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { Switch } from '../ui/switch'
import { ResponseStateChip } from './ResponseStateChip'

function ModalRadioOption({
  value,
  title,
  description,
  children,
}: {
  value: string
  title: string
  description?: string
  children?: ReactNode
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <RadioGroupItem
        className="mt-0.5 size-4"
        dotSize={9}
        value={value}
      />
      <div className="min-w-0 flex-1">
        <span className="block text-[13px] leading-5 tracking-[0.13px] text-black">
          {title}
        </span>
        {description ? (
          <span className="mt-0.5 block text-[11px] leading-4 tracking-[0.11px] text-[#616161]">
            {description}
          </span>
        ) : null}
        {children}
      </div>
    </label>
  )
}

function ModalCheckboxField({
  label,
  checked,
  onCheckedChange,
}: {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[13px] leading-5 tracking-[0.13px] text-black">
      <Checkbox
        checked={checked}
        className="size-4"
        iconSize={12}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <span>{label}</span>
    </label>
  )
}

export type PublishModalProps = {
  isPublished: boolean
  onPublish: () => void
  settings: FormAccessSettings
  onUpdateSettings: (partial: Partial<FormAccessSettings>) => void
  /**
   * Access settings as last saved — drives every readout in the modal (status chip,
   * schedule summary, share heading) so nothing looks changed until Save. The toggle
   * / radios / email list still bind to the live `settings` (they show what you're
   * about to save). Falls back to `settings` when omitted (create mode).
   */
  savedAccessSettings?: FormAccessSettings
  /** Respondent-facing URL for this form; only shown once the form is published. */
  shareUrl?: string
  /** Opens the Settings panel to the "Response window" section. */
  onEditSchedule?: () => void
}

export function PublishModal({
  isPublished,
  onPublish,
  settings,
  onUpdateSettings,
  savedAccessSettings,
  shareUrl,
  onEditSchedule,
}: PublishModalProps) {
  const [isCopied, setIsCopied] = useState(false)
  const now = useNow()

  // Every readout derives from the saved snapshot; controls still bind to `settings`.
  const saved = savedAccessSettings ?? settings
  const windowInputs = {
    isPublished,
    acceptingResponses: saved.acceptingResponses,
    startDate: saved.startDate,
    endDate: saved.endDate,
  }
  const state = deriveResponseState(windowInputs, now)
  const badge = describeResponseState(state, windowInputs)
  // Edit mode: something in the modal has been changed but not yet saved.
  const hasUnsavedChanges =
    savedAccessSettings != null && formAccessSettingsChanged(savedAccessSettings, settings)

  const handleCopyLink = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setIsCopied(true)
      window.setTimeout(() => setIsCopied(false), 2000)
    } catch {
      // Clipboard access denied by the browser; nothing to recover from.
    }
  }

  const shareHeading =
    state === 'scheduled'
      ? `Opens ${formatDateTime(saved.startDate)} — share the link now`
      : state === 'paused'
        ? 'Paused — the link still works'
        : state === 'closed'
          ? 'Response window ended'
          : 'Your form is live — share this link'

  return (
    <div className="flex w-[400px] max-w-[calc(100vw-32px)] flex-col gap-4 rounded-[10px] border border-[#d2d8e5] bg-white p-6 text-black shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
      <div className="flex items-center justify-between gap-3">
        <p className="m-0 text-[17px] leading-6 font-bold text-black">Publish Setting</p>
        <ResponseStateChip badge={badge} />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-[#1e55c5]">
              <MessageSquareText size={16} strokeWidth={2.2} />
              <span className="text-[14px] leading-5 font-semibold text-black">
                Open for answer
              </span>
            </div>
            <Switch
              checked={settings.acceptingResponses}
              className="h-3.75 w-7.5"
              onCheckedChange={(checked) => onUpdateSettings({ acceptingResponses: checked })}
              thumbClassName="size-[11.5px] data-[state=checked]:translate-x-4"
            />
          </div>

          <div className="flex items-start gap-1.5 rounded-[6px] bg-[#f7f8fb] px-2.5 py-2">
            <CalendarClock className="mt-px shrink-0 text-[#8b8e98]" size={13} />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[11px] leading-4 text-[#616161]">
                {scheduleSummary(saved)}
              </span>
              {state === 'scheduled' ? (
                <span className="text-[11px] leading-4 text-[#b7791f]">
                  This applies once the form opens.
                </span>
              ) : state === 'closed' ? (
                <span className="text-[11px] leading-4 text-[#b7791f]">
                  Window ended — edit the schedule to reopen.
                </span>
              ) : null}
              {onEditSchedule ? (
                <PopoverClose asChild>
                  <button
                    className="mt-0.5 inline-flex w-fit cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-[11px] font-medium text-[#1e55c5] hover:underline"
                    onClick={onEditSchedule}
                    type="button"
                  >
                    <PencilLine size={11} />
                    Edit schedule
                  </button>
                </PopoverClose>
              ) : null}
            </div>
          </div>

          <div className="h-px w-full bg-[#e8eaf1]" />

          <div className="flex flex-col gap-3.5">
            <div className="flex items-center gap-1.5">
              <Eye size={16} strokeWidth={2.2} />
              <span className="text-[14px] leading-5 tracking-[0.14px] font-semibold">
                Who can fill this form
              </span>
            </div>

            <RadioGroup
              className="gap-3 px-0.5"
              onValueChange={(value) =>
                onUpdateSettings({ whoCanFill: value as WhoCanFillValue })
              }
              value={settings.whoCanFill}
              aria-label="Who can fill this form"
            >
              <ModalRadioOption title="Anyone can respond" value="anyone">
                {settings.whoCanFill === 'anyone' ? (
                  <div className="mt-2 flex flex-col gap-2">
                    <ModalCheckboxField
                      checked={settings.anyoneOneResponsePerPerson}
                      label="One response per person"
                      onCheckedChange={(checked) =>
                        onUpdateSettings({ anyoneOneResponsePerPerson: checked })
                      }
                    />
                  </div>
                ) : null}
              </ModalRadioOption>

              <ModalRadioOption
                description="Sign-in required to validate access with organization"
                title="Only people in my organization can respond"
                value="organization"
              >
                {settings.whoCanFill === 'organization' ? (
                  <div className="mt-2 flex flex-col gap-2 pl-7">
                    <ModalCheckboxField
                      checked={settings.organizationRecordName}
                      label="Record name"
                      onCheckedChange={(checked) =>
                        onUpdateSettings({ organizationRecordName: checked })
                      }
                    />
                    <ModalCheckboxField
                      checked={settings.organizationOneResponsePerPerson}
                      label="One response per person"
                      onCheckedChange={(checked) =>
                        onUpdateSettings({
                          organizationOneResponsePerPerson: checked,
                        })
                      }
                    />
                  </div>
                ) : null}
              </ModalRadioOption>

              <ModalRadioOption
                title="Specific people in my organization can respond"
                value="specific"
              >
                {settings.whoCanFill === 'specific' ? (
                  <div className="mt-2 flex flex-col gap-2 pl-7">
                    <ModalCheckboxField
                      checked={settings.specificRecordName}
                      label="Record name"
                      onCheckedChange={(checked) =>
                        onUpdateSettings({ specificRecordName: checked })
                      }
                    />
                    <ModalCheckboxField
                      checked={settings.specificOneResponsePerPerson}
                      label="One response per person"
                      onCheckedChange={(checked) =>
                        onUpdateSettings({
                          specificOneResponsePerPerson: checked,
                        })
                      }
                    />
                    <SpecificPeopleField
                      emails={settings.specificEmails}
                      onChange={(emails) =>
                        onUpdateSettings({ specificEmails: emails })
                      }
                    />
                  </div>
                ) : null}
              </ModalRadioOption>
            </RadioGroup>
          </div>
        </div>

        {isPublished && shareUrl ? (
          <div className="flex flex-col gap-1.5">
            <span
              className={cn(
                'text-[12px] font-medium',
                state === 'open' ? 'text-[#1e55c5]' : 'text-[#726f6f]',
              )}
            >
              {shareHeading}
            </span>
            <div className="flex items-center gap-2 rounded-[8px] bg-[#f7f8fb] px-3 py-2">
              <Link2 className="shrink-0 text-[#616161]" size={16} />
              <a
                className="min-w-0 flex-1 truncate text-[12px] text-[#1e55c5] hover:underline"
                href={shareUrl}
                rel="noreferrer"
                target="_blank"
              >
                {shareUrl}
              </a>
              <Button
                className="h-7 shrink-0 rounded-[8px] border-primary px-3 text-[12px] font-medium text-primary hover:bg-[#eef3ff]"
                onClick={handleCopyLink}
                variant="outline"
              >
                {isCopied ? 'Copied!' : 'Copy link'}
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {hasUnsavedChanges ? (
        <div className="flex items-start gap-1.5 rounded-[6px] bg-[#fff8ec] px-2.5 py-2 text-[11px] leading-4 text-[#b7791f]">
          <TriangleAlert className="mt-px shrink-0" size={12} strokeWidth={2.2} />
          <span>
            Not applied yet — click{' '}
            <span className="font-semibold">{isPublished ? 'Save' : 'Publish'}</span> to apply your
            changes.
          </span>
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <PopoverClose asChild>
          <Button
            className="rounded-[5px] px-3 text-[13px] font-semibold tracking-[0.13px] text-[#726f6f]"
            variant="ghost"
          >
            {isPublished ? 'Close' : 'Cancel'}
          </Button>
        </PopoverClose>
        {isPublished ? (
          <PopoverClose asChild>
            <Button
              className="rounded-[5px] px-4 text-[13px] font-semibold tracking-[0.13px]"
              onClick={onPublish}
            >
              Save
            </Button>
          </PopoverClose>
        ) : (
          <Button
            className="rounded-[5px] px-4 text-[13px] font-semibold tracking-[0.13px]"
            onClick={onPublish}
          >
            Publish
          </Button>
        )}
      </div>
    </div>
  )
}
