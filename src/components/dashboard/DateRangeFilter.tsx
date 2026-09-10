import { Calendar as CalendarIcon, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import type { DateRange } from 'react-day-picker'

import { Calendar } from '../ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'

const DAY_MS = 24 * 60 * 60 * 1000

type PresetDays = 7 | 30 | 90
type PresetKey = PresetDays | 'custom'

const PRESETS: { key: PresetDays; label: string }[] = [
  { key: 7, label: '7 Days' },
  { key: 30, label: '30 Days' },
  { key: 90, label: '90 Days' },
]

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function rangeForPreset(days: PresetDays, today: Date): DateRange {
  const to = startOfDay(today)
  const from = new Date(to)
  from.setDate(from.getDate() - (days - 1))
  return { from, to }
}

/** Inclusive day span of a range. */
function daySpan(from: Date, to: Date) {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS) + 1
}

/** Which preset (if any) a range corresponds to — must span exactly N days AND end today. */
function detectPreset(range: DateRange | undefined, today: Date): PresetKey {
  if (!range?.from || !range.to) return 'custom'
  const endsToday = Math.abs(startOfDay(range.to).getTime() - startOfDay(today).getTime()) < DAY_MS
  if (!endsToday) return 'custom'
  return PRESETS.find((preset) => preset.key === daySpan(range.from!, range.to!))?.key ?? 'custom'
}

function formatChipDate(date: Date | undefined) {
  if (!date) {
    return 'Select date'
  }
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
}

function parseChipDate(text: string): Date | undefined {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text.trim())
  if (!match) {
    return undefined
  }
  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  const date = new Date(year, month - 1, day)
  const isRealDate =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
  return isRealDate ? date : undefined
}

function formatRange(range: DateRange | undefined) {
  if (!range?.from) {
    return 'Select dates'
  }
  if (!range.to) {
    return formatChipDate(range.from)
  }
  return `${formatChipDate(range.from)} - ${formatChipDate(range.to)}`
}

function DateChipInput({
  ariaLabel,
  borderClassName,
  onCommit,
  value,
}: {
  ariaLabel: string
  borderClassName: string
  onCommit: (date: Date) => void
  value: Date | undefined
}) {
  const [text, setText] = useState(() => formatChipDate(value))

  const commit = (typed: string) => {
    const parsed = parseChipDate(typed)
    if (parsed) {
      onCommit(parsed)
    } else {
      setText(formatChipDate(value))
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-1.75 rounded-[5px] border p-2.5 text-[12px] font-medium text-black ${borderClassName}`}
    >
      <CalendarIcon className="shrink-0" size={16} />
      <input
        aria-label={ariaLabel}
        className="w-18.5 bg-transparent text-black outline-none placeholder:text-[#929292]"
        maxLength={10}
        onBlur={(event) => commit(event.currentTarget.value)}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.currentTarget.blur()
          }
        }}
        placeholder="D/M/YYYY"
        type="text"
        value={text}
      />
    </span>
  )
}

export type DateRangeFilterProps = {
  /** The currently-applied window (ISO) — seeds the popover so it reflects what's shown. */
  value?: { from: string; to: string }
  /** Fires on "Select" with the picked window as ISO strings (start-of-day → end-of-day). */
  onChange?: (range: { from: string; to: string }) => void
  /** Overrides the trigger label — e.g. the server's nicely-formatted range string. */
  label?: string
}

export function DateRangeFilter({ value, onChange, label }: DateRangeFilterProps = {}) {
  const today = new Date()
  const [open, setOpen] = useState(false)
  const [draftPreset, setDraftPreset] = useState<PresetKey>('custom')
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(undefined)
  const [visibleMonth, setVisibleMonth] = useState<Date>(today)

  // The applied range comes entirely from the `value` prop (parent-owned).
  const appliedRange: DateRange | undefined = value
    ? { from: startOfDay(new Date(value.from)), to: startOfDay(new Date(value.to)) }
    : undefined

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) {
      // Seed the popover from what's actually applied, so it follows the default.
      const seed = appliedRange ?? rangeForPreset(90, today)
      setDraftRange(seed)
      setDraftPreset(detectPreset(seed, today))
      setVisibleMonth(seed.to ?? today)
    }
  }

  const handlePresetClick = (preset: PresetDays) => {
    const range = rangeForPreset(preset, today)
    setDraftPreset(preset)
    setDraftRange(range)
    setVisibleMonth(range.to ?? today)
  }

  const handleSelect = () => {
    setOpen(false)
    if (draftRange?.from) {
      const from = startOfDay(draftRange.from)
      const to = new Date(draftRange.to ?? draftRange.from)
      to.setHours(23, 59, 59, 999)
      onChange?.({ from: from.toISOString(), to: to.toISOString() })
    }
  }

  const handleFromCommit = (date: Date) => {
    setDraftPreset('custom')
    setDraftRange((prev) => (prev?.to && date > prev.to ? { from: prev.to, to: date } : { from: date, to: prev?.to }))
    setVisibleMonth(date)
  }

  const handleToCommit = (date: Date) => {
    setDraftPreset('custom')
    setDraftRange((prev) => (prev?.from && date < prev.from ? { from: date, to: prev.from } : { from: prev?.from, to: date }))
    setVisibleMonth(date)
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <span className="text-[9.5px] font-medium text-black">Show reports for:</span>
      <Popover onOpenChange={handleOpenChange} open={open}>
        <PopoverTrigger asChild>
          <button
            className="inline-flex h-11.25 min-w-33.75 items-center justify-center gap-1.75 rounded-[10px] border border-[#1e55c5] bg-white px-4 text-[12px] font-semibold whitespace-nowrap text-[#1e55c5] transition-colors hover:bg-[#f7f8fb] data-[state=open]:bg-[#f7f8fb]"
            type="button"
          >
            <SlidersHorizontal size={16} />
            {label ?? formatRange(appliedRange)}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-75 max-h-(--radix-popover-content-available-height) overflow-y-auto rounded-[10px] border border-[#d1d1d1] bg-white p-0 shadow-[0_12px_32px_rgba(15,23,42,0.12)]"
          side="bottom"
          sideOffset={8}
        >
          <div className="flex flex-col gap-3.75 px-5 py-2.5">
            <div className="flex flex-col gap-2.5">
              <p className="m-0 text-[12px] font-medium text-black">Show report for the last:</p>
              <div className="flex items-center gap-3.5 text-[12px]">
                {PRESETS.map((preset) => (
                  <button
                    className={
                      draftPreset === preset.key
                        ? 'font-semibold text-[#1e55c5]'
                        : 'font-medium text-[#929292]'
                    }
                    key={preset.key}
                    onClick={() => handlePresetClick(preset.key)}
                    type="button"
                  >
                    {preset.label}
                  </button>
                ))}
                <button
                  className={
                    draftPreset === 'custom'
                      ? 'font-semibold text-[#1e55c5]'
                      : 'font-medium text-[#929292]'
                  }
                  onClick={() => setDraftPreset('custom')}
                  type="button"
                >
                  Custom
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <p className="m-0 text-[12px] font-medium text-black">Select your date range:</p>
              <div className="flex items-center justify-between">
                <DateChipInput
                  ariaLabel="Start date"
                  borderClassName="border-[#929292] focus-within:border-[#1e55c5]"
                  key={draftRange?.from?.getTime() ?? 'from-empty'}
                  onCommit={handleFromCommit}
                  value={draftRange?.from}
                />
                <DateChipInput
                  ariaLabel="End date"
                  borderClassName="border-[#1e55c5]"
                  key={draftRange?.to?.getTime() ?? 'to-empty'}
                  onCommit={handleToCommit}
                  value={draftRange?.to}
                />
              </div>
            </div>

            <Calendar
              mode="range"
              month={visibleMonth}
              onMonthChange={setVisibleMonth}
              onSelect={(range) => {
                setDraftRange(range)
                setDraftPreset('custom')
              }}
              selected={draftRange}
            />
          </div>

          <div className="flex items-center justify-end p-2.5">
            <button
              className="cursor-pointer py-1.25 text-[12px] font-semibold text-[#1e55c5] hover:underline"
              onClick={handleSelect}
              type="button"
            >
              Select
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
