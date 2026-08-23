import { Check, Circle, Eye, Link2, MessageSquareText } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { Checkbox as RadixCheckbox, Popover, RadioGroup, Switch } from 'radix-ui'

const shareUrl = 'https://opengnp.com/cs-focus-group-2026-feedback'

function ToggleSwitch({ defaultChecked }: { defaultChecked?: boolean }) {
  return (
    <Switch.Root
      className="relative inline-flex h-[15px] w-[30px] shrink-0 cursor-pointer items-center rounded-full bg-[#d2d8e5] outline-none transition-colors data-[state=checked]:bg-[#1e55c5]"
      defaultChecked={defaultChecked}
    >
      <Switch.Thumb className="block size-[11.5px] translate-x-0.5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-[16px]" />
    </Switch.Root>
  )
}

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
      <RadioGroup.Item
        className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-[#b0b1b3] bg-white text-[#1e55c5] outline-none data-[state=checked]:border-[#1e55c5] focus-visible:ring-2 focus-visible:ring-[#1e55c5]/30"
        value={value}
      >
        <RadioGroup.Indicator>
          <Circle className="fill-current" size={9} strokeWidth={0} />
        </RadioGroup.Indicator>
      </RadioGroup.Item>
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
  defaultChecked = false,
}: {
  label: string
  defaultChecked?: boolean
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[13px] leading-5 tracking-[0.13px] text-black">
      <RadixCheckbox.Root
        className="inline-flex size-4 shrink-0 items-center justify-center rounded-[3px] border border-[#b0b1b3] bg-white text-white outline-none data-[state=checked]:border-[#1e55c5] data-[state=checked]:bg-[#1e55c5] focus-visible:ring-2 focus-visible:ring-[#1e55c5]/30"
        defaultChecked={defaultChecked}
      >
        <RadixCheckbox.Indicator>
          <Check size={12} strokeWidth={3} />
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      <span>{label}</span>
    </label>
  )
}

export type PublishModalProps = {
  isPublished: boolean
  onPublish: () => void
}

export function PublishModal({ isPublished, onPublish }: PublishModalProps) {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setIsCopied(true)
      window.setTimeout(() => setIsCopied(false), 2000)
    } catch {
      // Clipboard access denied by the browser; nothing to recover from.
    }
  }

  return (
    <div className="flex w-[400px] max-w-[calc(100vw-32px)] flex-col gap-4 rounded-[10px] border border-[#d2d8e5] bg-white p-4 text-black shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
      <p className="m-0 text-[17px] leading-6 font-bold text-black">
        Publish Setting
      </p>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-[#1e55c5]">
              <MessageSquareText size={16} strokeWidth={2.2} />
              <span className="text-[14px] leading-5 font-semibold text-black">
                Open for answer
              </span>
            </div>
            <ToggleSwitch />
          </div>

          <div className="h-px w-full bg-[#e8eaf1]" />

          <div className="flex flex-col gap-3.5">
            <div className="flex items-center gap-1.5">
              <Eye size={16} strokeWidth={2.2} />
              <span className="text-[14px] leading-5 tracking-[0.14px] font-semibold">
                Who can fill this form
              </span>
            </div>

            <RadioGroup.Root
              className="flex flex-col gap-3 px-0.5"
              defaultValue="organization"
              aria-label="Who can fill this form"
            >
              <ModalRadioOption title="Anyone can respond" value="anyone" />

              <ModalRadioOption
                description="Sign-in required to validate access with organization"
                title="Only people in my organization can respond"
                value="organization"
              >
                <div className="mt-2 flex flex-col gap-2 pl-7">
                  <ModalCheckboxField defaultChecked label="Record name" />
                  <ModalCheckboxField label="One response per person" />
                </div>
              </ModalRadioOption>

              <ModalRadioOption
                title="Specific people in my organization can respond"
                value="specific"
              />
            </RadioGroup.Root>
          </div>
        </div>

        {isPublished ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-[#1e55c5]">
              Your form is live — share this link
            </span>
            <div className="flex items-center gap-2 rounded-[8px] bg-[#f7f8fb] px-3 py-2">
              <Link2 className="shrink-0 text-[#616161]" size={16} />
              <span className="min-w-0 flex-1 truncate text-[12px] text-[#726f6f]">
                {shareUrl}
              </span>
              <button
                className="inline-flex h-7 shrink-0 cursor-pointer items-center justify-center rounded-[8px] border border-[#1e55c5] px-3 text-[12px] font-medium text-[#1e55c5] transition-colors hover:bg-[#eef3ff]"
                onClick={handleCopyLink}
                type="button"
              >
                {isCopied ? 'Copied!' : 'Copy link'}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-end gap-2">
        <Popover.Close asChild>
          <button
            className="inline-flex h-8 cursor-pointer items-center justify-center rounded-[5px] border-0 bg-transparent px-3 text-[13px] font-semibold tracking-[0.13px] text-[#726f6f] transition-colors hover:bg-[#f7f8fb]"
            type="button"
          >
            {isPublished ? 'Close' : 'Cancel'}
          </button>
        </Popover.Close>
        {isPublished ? (
          <Popover.Close asChild>
            <button
              className="inline-flex h-8 cursor-pointer items-center justify-center rounded-[5px] border-0 bg-[#1e55c5] px-4 text-[13px] font-semibold tracking-[0.13px] text-white transition-colors hover:bg-[#1a49aa]"
              onClick={onPublish}
              type="button"
            >
              Save
            </button>
          </Popover.Close>
        ) : (
          <button
            className="inline-flex h-8 cursor-pointer items-center justify-center rounded-[5px] border-0 bg-[#1e55c5] px-4 text-[13px] font-semibold tracking-[0.13px] text-white transition-colors hover:bg-[#1a49aa]"
            onClick={onPublish}
            type="button"
          >
            Publish
          </button>
        )}
      </div>
    </div>
  )
}
