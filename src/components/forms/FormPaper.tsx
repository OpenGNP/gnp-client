import type { ComponentProps, ReactNode } from 'react'

import { cn } from '../../lib/utils'

/*
 * The form's page, shared by the editor (Create / Edit) and the respondent's page, so a
 * form looks the same to whoever builds it and whoever answers it: same card, cover,
 * title and section headings. Only the questions differ (editing vs. answering).
 */

/** The white card: 978px wide at most, with the editor's padding. */
export function FormPaper({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cn(
        "w-full max-w-[978px] overflow-hidden rounded-[10px] bg-white pt-15.25 pr-17.5 pb-17.25 pl-20 font-['Inter_Variable'] shadow-sm max-[760px]:px-6 max-[760px]:pt-9 max-[760px]:pb-12",
        className,
      )}
      {...props}
    />
  )
}

/**
 * Edge to edge across the top of a FormPaper (cancels its padding), with room below for
 * the title. Always 5:1 (e.g. 1500 × 300), so an image is cropped the same on every screen.
 */
export const FORM_COVER_CLASS =
  'relative -mt-15.25 -mr-17.5 mb-4 -ml-20 aspect-[5/1] w-auto shrink-0 overflow-hidden max-[760px]:-mx-6 max-[760px]:-mt-9'

/** The cover image, the first thing in a FormPaper. */
export function FormCover({ src, alt = '', children }: { src: string; alt?: string; children?: ReactNode }) {
  return (
    <div className={FORM_COVER_CLASS}>
      {/* Out of flow, so a tall image can't stretch the box past 5:1 (an aspect-ratio box
          otherwise grows to fit its content). */}
      <img alt={alt} className="absolute inset-0 size-full object-cover" src={src} />
      {children}
    </div>
  )
}

/** The form title's type: the editor puts it on an input, the respondent page on an h1. */
export const FORM_TITLE_CLASS = 'm-0 text-[32px] font-bold tracking-[0.32px] text-[#14181f] max-[560px]:text-[24px]'
export const FORM_DIVIDER_CLASS = 'h-px w-full bg-[#e8eaf1]'
export const FORM_DESCRIPTION_CLASS = 'm-0 text-[16px] leading-6 tracking-[0.16px] text-[#616161]'

/** "Demographic" / "Feedback": brand blue, a step below the form title. */
export function FormSectionTitle({ className, ...props }: ComponentProps<'h2'>) {
  return (
    <h2
      className={cn('m-0 text-[20px] leading-7 font-bold tracking-[0.2px] text-[#1e55c5]', className)}
      {...props}
    />
  )
}
