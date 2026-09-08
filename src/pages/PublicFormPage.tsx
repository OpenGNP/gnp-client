import { CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { submitFeedback, type FeedbackAnswerPayload } from '../api/feedback'
import { getPublicForm, type ApiFormField, type ApiPublicForm } from '../api/forms'
import { Button } from '../components/ui/button'
import { Checkbox } from '../components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group'
import { useNow } from '../hooks/useNow'
import { ApiError } from '../lib/api'
import { deriveResponseState, formatDateTime } from '../lib/responseWindow'
import { cn } from '../lib/utils'

const OTHER_VALUE = '__other__'

type TextAnswer = { kind: 'text'; value: string }
type ChoiceAnswer = { kind: 'choice'; optionIds: number[]; other: string | null }
type Answer = TextAnswer | ChoiceAnswer

function isChoice(field: ApiFormField) {
  return field.fieldType === 'radio' || field.fieldType === 'checkbox'
}

function initialAnswers(fields: ApiFormField[]): Record<number, Answer> {
  const answers: Record<number, Answer> = {}
  for (const field of fields) {
    answers[field.id] = isChoice(field)
      ? { kind: 'choice', optionIds: [], other: null }
      : { kind: 'text', value: '' }
  }
  return answers
}

function isAnswered(answer: Answer | undefined): boolean {
  if (!answer) return false
  if (answer.kind === 'text') return answer.value.trim() !== ''
  return answer.optionIds.length > 0 || (answer.other !== null && answer.other.trim() !== '')
}

function buildAnswerPayload(fields: ApiFormField[], answers: Record<number, Answer>): FeedbackAnswerPayload[] {
  const payload: FeedbackAnswerPayload[] = []
  for (const field of fields) {
    const answer = answers[field.id]
    if (!answer) continue

    if (answer.kind === 'text') {
      const text = answer.value.trim()
      if (text) payload.push({ fieldId: field.id, answerText: text.slice(0, 5000) })
      continue
    }

    for (const optionId of answer.optionIds) {
      payload.push({ fieldId: field.id, answerOptionId: optionId })
    }
    if (answer.other !== null) {
      const text = answer.other.trim()
      if (text) payload.push({ fieldId: field.id, answerText: text.slice(0, 5000) })
    }
  }
  return payload
}

function describeLoadError(error: unknown): { title: string; body: string } {
  const status = error instanceof ApiError ? error.status : 0
  if (status === 404) {
    return { title: 'This form isn’t available', body: 'It may have been unpublished or removed.' }
  }
  if (status === 401) {
    return {
      title: 'Sign-in required',
      body: 'This form is limited to a specific organization. Open the link while signed in to respond.',
    }
  }
  if (status === 403) {
    return { title: 'No access', body: 'You don’t have permission to respond to this form.' }
  }
  return {
    title: 'Something went wrong',
    body: error instanceof ApiError ? error.message : 'The form could not be loaded. Please try again.',
  }
}

const cardClass =
  'mx-auto w-full max-w-[720px] rounded-[10px] bg-white p-8 shadow-[0_2px_12px_rgba(31,43,69,0.10)] max-[560px]:p-5'
const inputClass =
  'w-full rounded-[5px] border border-[#d2d8e5] bg-[#f7f8fb] px-3.5 py-2.5 text-[14px] text-black tracking-[0.14px] outline-none placeholder:text-[#bdbdbd] focus:border-[#1e55c5]'

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f9ff] px-4 py-12 font-['Inter_Variable'] text-[#050608] max-[560px]:py-6">
      {children}
    </div>
  )
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <Shell>
      <div className={cn(cardClass, 'text-center')}>
        <h1 className="m-0 mb-2 text-[20px] font-semibold tracking-[0.2px] text-[#3f4045]">{title}</h1>
        <p className="m-0 text-[14px] leading-5 text-[#726f6f]">{body}</p>
      </div>
    </Shell>
  )
}

function ChoiceField({
  field,
  answer,
  onChange,
}: {
  field: ApiFormField
  answer: ChoiceAnswer
  onChange: (next: ChoiceAnswer) => void
}) {
  const options = field.fieldOptions
    .slice()
    .sort((a, b) => (a.optionOrder ?? 0) - (b.optionOrder ?? 0))

  if (field.fieldType === 'checkbox') {
    const toggle = (optionId: number, checked: boolean) => {
      const optionIds = checked
        ? [...answer.optionIds, optionId]
        : answer.optionIds.filter((id) => id !== optionId)
      onChange({ ...answer, optionIds })
    }

    return (
      <div className="flex flex-col gap-2.5">
        {options.map((option) => (
          <label key={option.id} className="flex cursor-pointer items-start gap-2.5 text-[14px] leading-5 text-black">
            <Checkbox
              checked={answer.optionIds.includes(option.id)}
              className="mt-0.5"
              onCheckedChange={(value) => toggle(option.id, value === true)}
            />
            <span>{option.optionLabel}</span>
          </label>
        ))}
        {field.allowOther ? (
          <div className="flex flex-col gap-2">
            <label className="flex cursor-pointer items-start gap-2.5 text-[14px] leading-5 text-black">
              <Checkbox
                checked={answer.other !== null}
                className="mt-0.5"
                onCheckedChange={(value) =>
                  onChange({ ...answer, other: value === true ? (answer.other ?? '') : null })
                }
              />
              <span>Other</span>
            </label>
            {answer.other !== null ? (
              <input
                aria-label={`${field.fieldLabel ?? 'Question'} — other`}
                className={cn(inputClass, 'ml-7.5 max-w-[calc(100%-30px)]')}
                onChange={(event) => onChange({ ...answer, other: event.target.value })}
                placeholder="Your answer"
                value={answer.other}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    )
  }

  // radio
  const value =
    answer.other !== null ? OTHER_VALUE : answer.optionIds[0] !== undefined ? String(answer.optionIds[0]) : ''

  return (
    <RadioGroup
      className="gap-2.5"
      onValueChange={(next) =>
        onChange(
          next === OTHER_VALUE
            ? { ...answer, optionIds: [], other: answer.other ?? '' }
            : { ...answer, optionIds: [Number(next)], other: null },
        )
      }
      value={value}
    >
      {options.map((option) => (
        <label key={option.id} className="flex cursor-pointer items-start gap-2.5 text-[14px] leading-5 text-black">
          <RadioGroupItem className="mt-0" value={String(option.id)} />
          <span>{option.optionLabel}</span>
        </label>
      ))}
      {field.allowOther ? (
        <div className="flex flex-col gap-2">
          <label className="flex cursor-pointer items-start gap-2.5 text-[14px] leading-5 text-black">
            <RadioGroupItem className="mt-0" value={OTHER_VALUE} />
            <span>Other</span>
          </label>
          {answer.other !== null ? (
            <input
              aria-label={`${field.fieldLabel ?? 'Question'} — other`}
              className={cn(inputClass, 'ml-7.5 max-w-[calc(100%-30px)]')}
              onChange={(event) => onChange({ ...answer, other: event.target.value })}
              placeholder="Your answer"
              value={answer.other}
            />
          ) : null}
        </div>
      ) : null}
    </RadioGroup>
  )
}

export function PublicFormPage() {
  const { id } = useParams()
  const formId = Number(id)
  const hasValidId = Number.isInteger(formId) && formId > 0

  const [status, setStatus] = useState<'loading' | 'error' | 'ready' | 'submitted'>(
    hasValidId ? 'loading' : 'error',
  )
  const [loadError, setLoadError] = useState<{ title: string; body: string }>(
    hasValidId
      ? { title: '', body: '' }
      : { title: 'This form isn’t available', body: 'The link looks incomplete.' },
  )
  const now = useNow(15_000)
  const [form, setForm] = useState<ApiPublicForm | null>(null)
  const [answers, setAnswers] = useState<Record<number, Answer>>({})
  // Once someone starts answering, a window boundary passing keeps the form on screen
  // (with a banner) rather than yanking their work — see the gate below.
  const [hasInteracted, setHasInteracted] = useState(false)

  const [submitState, setSubmitState] = useState<'idle' | 'submitting'>('idle')
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!hasValidId) {
      return
    }

    let cancelled = false

    getPublicForm(formId)
      .then((data) => {
        if (cancelled) return
        setForm(data)
        setAnswers(initialAnswers(data.fields))
        setStatus('ready')
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setLoadError(describeLoadError(error))
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [formId, hasValidId])

  if (status === 'loading') {
    return (
      <Shell>
        <p className="mx-auto max-w-[720px] text-center text-[14px] text-[#8b8e98]">Loading the form…</p>
      </Shell>
    )
  }

  if (status === 'error') {
    return <Notice body={loadError.body} title={loadError.title} />
  }

  if (status === 'submitted') {
    return (
      <Shell>
        <div className={cn(cardClass, 'flex flex-col items-center gap-3 text-center')}>
          <CheckCircle2 className="text-[#08882c]" size={44} strokeWidth={1.8} />
          <h1 className="m-0 text-[20px] font-semibold tracking-[0.2px] text-[#3f4045]">Response submitted</h1>
          <p className="m-0 text-[14px] leading-5 text-[#726f6f]">Thanks for filling out this form.</p>
        </div>
      </Shell>
    )
  }

  if (!form) {
    return <Notice body="Please try again." title="Something went wrong" />
  }

  // Recomputed on every `useNow` tick, so the form opens/closes on its own as the
  // start/end time passes — no reload needed.
  const responseState = deriveResponseState(
    {
      isPublished: true,
      acceptingResponses: form.acceptingResponses,
      startDate: form.startDate,
      endDate: form.endDate,
    },
    now,
  )
  const isOpen = responseState === 'open'

  if (!isOpen && !hasInteracted) {
    if (responseState === 'scheduled') {
      return (
        <Notice
          body={
            form.startDate ? `This form opens on ${formatDateTime(form.startDate)}.` : 'This form opens later.'
          }
          title="Not open yet"
        />
      )
    }
    if (responseState === 'closed') {
      return (
        <Notice
          body={form.endDate ? `This form closed on ${formatDateTime(form.endDate)}.` : 'This form is closed.'}
          title="This form is closed"
        />
      )
    }
    return <Notice body="The owner has paused new responses for now." title="Not accepting responses" />
  }

  const orderedFields = form.fields.slice().sort((a, b) => (a.fieldOrder ?? 0) - (b.fieldOrder ?? 0))

  const setAnswer = (fieldId: number, next: Answer) => {
    setHasInteracted(true)
    setAnswers((current) => ({ ...current, [fieldId]: next }))
  }

  const closedNotice =
    responseState === 'closed'
      ? 'This form just closed — you can no longer submit a response.'
      : responseState === 'scheduled'
        ? 'This form isn’t open for responses yet.'
        : responseState === 'paused'
          ? 'The owner has paused new responses.'
          : ''

  const handleSubmit = async () => {
    if (submitState === 'submitting') return

    if (!isOpen) {
      setSubmitError(closedNotice || 'This form isn’t accepting responses right now.')
      return
    }

    const missing = orderedFields.filter(
      (field) => field.isRequired && !isAnswered(answers[field.id]),
    )
    if (missing.length > 0) {
      setSubmitError(
        `Please answer: ${missing.map((field) => field.fieldLabel ?? 'Untitled question').join(', ')}`,
      )
      return
    }

    const payload = buildAnswerPayload(orderedFields, answers)
    if (payload.length === 0) {
      setSubmitError('Answer at least one question before submitting.')
      return
    }

    setSubmitError('')
    setSubmitState('submitting')
    try {
      await submitFeedback({ formId: form.id, answers: payload })
      setStatus('submitted')
    } catch (error) {
      setSubmitState('idle')
      setSubmitError(
        error instanceof ApiError ? error.message : 'Could not submit your response. Please try again.',
      )
    }
  }

  return (
    <Shell>
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-5">
        <div className={cardClass}>
          <h1 className="m-0 text-[26px] leading-8 font-semibold tracking-[0.26px] text-[#3f4045] max-[560px]:text-[22px]">
            {form.formTitle ?? 'Untitled form'}
          </h1>
          {form.formDescription ? (
            <p className="m-0 mt-2 text-[14px] leading-5 text-[#726f6f]">{form.formDescription}</p>
          ) : null}
        </div>

        {!isOpen ? (
          <div className="rounded-[10px] border border-[#f3c6cf] bg-[#fdf2f4] px-5 py-3 text-[13px] leading-5 text-[#c02b47]">
            {closedNotice}
          </div>
        ) : null}

        {orderedFields.map((field) => {
          const answer = answers[field.id]
          return (
            <div className={cardClass} key={field.id}>
              <label className="mb-3 block text-[15px] leading-5 font-medium text-black">
                {field.fieldLabel ?? 'Untitled question'}
                {field.isRequired ? <span className="ml-1 text-[#e0507a]">*</span> : null}
              </label>

              {answer?.kind === 'choice' ? (
                <ChoiceField
                  answer={answer}
                  field={field}
                  onChange={(next) => setAnswer(field.id, next)}
                />
              ) : field.fieldType === 'textarea' ? (
                <textarea
                  className={cn(inputClass, 'min-h-[96px] resize-y')}
                  onChange={(event) => setAnswer(field.id, { kind: 'text', value: event.target.value })}
                  placeholder="Your answer"
                  value={answer?.kind === 'text' ? answer.value : ''}
                />
              ) : (
                <input
                  className={inputClass}
                  onChange={(event) => setAnswer(field.id, { kind: 'text', value: event.target.value })}
                  placeholder="Your answer"
                  value={answer?.kind === 'text' ? answer.value : ''}
                />
              )}
            </div>
          )
        })}

        <div className={cn(cardClass, 'flex flex-col gap-3')}>
          {submitError ? <p className="m-0 text-[13px] text-[#e0507a]">{submitError}</p> : null}
          <Button
            className="h-10 self-start px-6"
            disabled={submitState === 'submitting' || !isOpen}
            onClick={handleSubmit}
          >
            {submitState === 'submitting' ? 'Submitting…' : 'Submit'}
          </Button>
        </div>
      </div>
    </Shell>
  )
}
