import {
  ArrowRight,
  ChevronDown,
  EyeOff,
  Link as LinkIcon,
  MessageSquareText,
  Server,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  TriangleAlert,
  UserCheck,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import type { ViolationReview } from '../api/analytics'
import { FeedbackPointCard } from '../components/dashboard/FeedbackSegmentSection'
import { SentimentBar } from '../components/dashboard/SentimentBar'
import { SENTIMENT_COLORS } from '../components/dashboard/sentimentColors'
import { WhatChangedCard } from '../components/dashboard/TrendView'
import { MicrosoftSignInButton } from '../components/MicrosoftSignInButton'
import { Button } from '../components/ui/button'
import { brand } from '../data/dashboard'
import type { FeedbackPoint } from '../data/dashboardAnalytics'
import {
  LANDING_SAMPLE_OPTIONS,
  LANDING_SAMPLES,
  type LandingSample,
  type LandingSampleId,
  type LandingTopic,
} from '../data/landingSample'
import { TOPIC_SORT_OPTIONS } from '../components/dashboard/topicSort'
import { HeadroomBar } from '../components/navigation/HeadroomBar'
import { SAMPLE_FORM_MODEL } from '../data/sampleDashboard'
import { useFormAccessSettings } from '../hooks/useFormAccessSettings'
import { useFormEditorModel } from '../hooks/useFormEditorModel'
import { CreateFormPage } from './CreateFormPage'
import { FormDashboardPage } from './FormDashboardPage'
import { useAuth } from '../lib/auth'
import { msalInstance } from '../lib/msal'
import { cn } from '../lib/utils'

// Largest sample topic (42 points) rounded up to a step of 10, as the dashboard's axis does.
const AXIS_MAX = 50

const linkClass =
  'rounded-[4px] text-[#1e55c5] underline-offset-3 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e55c5]'

function SampleTag() {
  return (
    <span className="shrink-0 rounded-full bg-[#fff4d9] px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-[#7a5a00]">Sample data</span>
  )
}

/** The real sign-in, so the page's action works in place (the email form stands in when MSAL isn't configured). */
function SignInAction({ tone = 'light' }: { tone?: 'light' | 'blue' }) {
  const [error, setError] = useState('')
  const signedIn = useAuth().status === 'ready'
  if (signedIn) {
    return (
      <Button
        asChild
        className={`h-10.5 w-full max-w-80 justify-center rounded-[10px] text-[14px] font-semibold ${
          tone === 'blue' ? 'bg-white text-[#1e55c5] hover:bg-[#e8eefc] focus-visible:ring-white' : ''
        }`}
      >
        <Link to="/">
          Go to home
          <ArrowRight size={16} />
        </Link>
      </Button>
    )
  }
  return (
    <div className="flex w-full max-w-80 flex-col gap-3">
      {msalInstance ? (
        <MicrosoftSignInButton
          onBusyChange={() => {}}
          onError={setError}
          // On the blue band the white button already stands out; on the light hero it takes the blue.
          variant={tone === 'blue' ? 'default' : 'primary'}
          // The usual blue focus ring would vanish on the blue band.
          className={tone === 'blue' ? 'focus-visible:outline-white' : undefined}
        />
      ) : (
        <Button
          asChild
          className={`h-10.5 w-full justify-center rounded-[10px] text-[14px] font-semibold ${
            tone === 'blue' ? 'bg-white text-[#1e55c5] hover:bg-[#e8eefc] focus-visible:ring-white' : ''
          }`}
        >
          <Link to="/login">Sign in</Link>
        </Button>
      )}
      {error ? (
        <p className="m-0 rounded-[8px] bg-[#fdecec] px-3 py-2 text-[12px] text-[#c0392b]" role="alert">
          {error}
        </p>
      ) : null}
      <p className={`m-0 text-[12px] leading-4.5 ${tone === 'blue' ? 'text-[#dbe6ff]' : 'text-[#726f6f]'}`}>
        By signing in, you agree to the{' '}
        <Link className={tone === 'blue' ? cn(linkClass, 'text-white underline focus-visible:outline-white') : linkClass} to="/terms">
          Terms of Use
        </Link>{' '}
        and acknowledge the{' '}
        <Link className={tone === 'blue' ? cn(linkClass, 'text-white underline focus-visible:outline-white') : linkClass} to="/privacy">
          Privacy Notice
        </Link>
        .
      </p>
    </div>
  )
}

type DashboardRow = LandingTopic & { change?: 'worse' | 'new' }

/** The sample's topics as the Themes tab lists them: flagged first, tagged Worse or New from What changed. */
function dashboardRows(sample: LandingSample): DashboardRow[] {
  const changes = new Map<string, 'worse' | 'new'>()
  for (const row of sample.whatChanged.rows) {
    if (row.kind === 'worse' || row.kind === 'new') changes.set(row.id, row.kind)
  }
  const rows: DashboardRow[] = sample.topics.map((topic) => ({ ...topic, change: changes.get(topic.id) }))
  // A new topic What changed found but the topic list doesn't hold yet.
  for (const row of sample.whatChanged.rows) {
    if (row.kind !== 'new' || rows.some((topic) => topic.id === row.id)) continue
    const counts = row.complaintCounts?.current ?? { negative: 0, total: 0 }
    rows.push({
      id: row.id,
      label: row.label,
      negative: counts.negative,
      neutral: counts.total - counts.negative,
      positive: 0,
      percentOfTotal: row.share.current,
      change: 'new',
    })
  }
  // The dashboard's default Priority order: flagged first, then most negative (topicSort.ts).
  const priority = TOPIC_SORT_OPTIONS.find((option) => option.value === 'priority')!.compare
  return rows.sort((a, b) => Number(Boolean(b.hasViolation)) - Number(Boolean(a.hasViolation)) || priority(a, b))
}

/** The app's window, as every demo on this page shows it: chrome, the form's name, its view tabs. */
function AppFrame({
  sample,
  tab,
  className = '',
  children,
}: {
  sample: LandingSample
  tab: 'Themes' | 'Trend' | 'Response' | 'Individual'
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      aria-label={`Sample dashboard for ${sample.formTitle}, ${tab} tab`}
      className={`mx-auto w-full max-w-224 min-w-0 overflow-hidden rounded-[15px] border border-[#e3e7f0] bg-white shadow-[0_24px_60px_rgba(20,40,90,0.12)] ${className}`}
      role="group"
    >
      <div aria-hidden="true" className="flex h-9 items-center gap-1.5 border-b border-[#eef0f4] bg-[#f7f8fb] px-3.5">
        <span className="size-2.5 rounded-full bg-[#d9dde6]" />
        <span className="size-2.5 rounded-full bg-[#d9dde6]" />
        <span className="size-2.5 rounded-full bg-[#d9dde6]" />
      </div>
      <div className="flex flex-col gap-4 p-6 max-[560px]:p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="m-0 text-[20px] font-semibold text-[#14181f]">{sample.formTitle}</p>
          <SampleTag />
        </div>
        <div aria-hidden="true" className="flex flex-wrap gap-2.5">
          {(['Themes', 'Trend', 'Response', 'Individual'] as const).map((name) => (
            <span
              className={`inline-flex h-8 items-center rounded-full px-3 text-[13px] font-semibold ${
                name === tab ? 'bg-[#1e55c5] text-white' : 'border border-[#c9cfdb] text-[#726f6f]'
              }`}
              key={name}
            >
              {name}
            </span>
          ))}
        </div>
        {children}
      </div>
    </div>
  )
}

/** A section's centred heading and one line on what to look at. */
function SectionIntro({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-180 flex-col items-center gap-4 text-center">
      <h2 className="m-0 text-[32px] leading-[1.15] font-semibold tracking-[-0.01em] text-balance" id={id}>
        {title}
      </h2>
      <p className="m-0 text-[16px] leading-6.5 text-[#3f4045]">{children}</p>
    </div>
  )
}

const SECTION = 'mx-auto flex max-w-300 flex-col gap-12 px-6 py-24 max-[560px]:px-4 max-[560px]:py-16'

/** The Themes tab's topic rows; one can be opened in place to read what people said. */
function TopicRows({ rows, sample }: { rows: DashboardRow[]; sample: LandingSample }) {
  const [openId, setOpenId] = useState<string | null>(null)
  return (
    <ul className="m-0 list-none p-0">
      {rows.map((row) => {
        const open = openId === row.id
        const panelId = `topic-${row.id}-details`
        // The answers filed under this topic; a new topic only has What changed's quote.
        const quotes = sample.comments.filter((comment) => comment.topicId === row.id).map((comment) => comment.text)
        const fallback = sample.whatChanged.rows.find((changed) => changed.id === row.id)?.quote
        const shown = (quotes.length > 0 ? quotes : fallback ? [fallback] : []).slice(0, 3)
        return (
          <li
            className={`border-l-[3px] transition-colors ${
              open ? 'border-[#1e55c5] bg-[#f7f8fb]' : row.hasViolation ? 'border-transparent bg-[#fff7f8]' : 'border-transparent'
            }`}
            key={row.id}
          >
            <button
              aria-controls={panelId}
              aria-expanded={open}
              className="grid w-full cursor-pointer grid-cols-[minmax(0,16rem)_minmax(0,1fr)_2.75rem_1rem] items-center gap-4 border-0 bg-transparent px-4 py-2.5 text-left transition-colors [grid-template-areas:'name_bar_pct_chev'] hover:bg-[#f7f8fb] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#1e55c5] max-[700px]:grid-cols-[minmax(0,1fr)_2.75rem_1rem] max-[700px]:gap-y-1.5 max-[700px]:[grid-template-areas:'name_pct_chev'_'bar_bar_bar']"
              onClick={() => setOpenId(open ? null : row.id)}
              type="button"
            >
              <span className="flex min-w-0 items-center gap-2 text-[14px] text-[#14181f] [grid-area:name]">
                <span className={`truncate ${open ? 'font-medium' : ''}`}>{row.label}</span>
                {row.hasViolation ? (
                  <TriangleAlert aria-label="Contains possible violations" className="shrink-0 text-[#e0507a]" role="img" size={15} />
                ) : null}
                {row.change === 'worse' ? (
                  <span className="shrink-0 rounded-full bg-[#fdecea] px-2 py-0.5 text-[11px] font-semibold text-[#c4280b]">
                    Worse
                  </span>
                ) : row.change === 'new' ? (
                  <span className="shrink-0 rounded-full bg-[#edf2fd] px-2 py-0.5 text-[11px] font-semibold text-[#1e55c5]">
                    New
                  </span>
                ) : null}
              </span>
              <SentimentBar
                className="min-w-0 [grid-area:bar]"
                maxValue={AXIS_MAX}
                negative={row.negative}
                neutral={row.neutral}
                positive={row.positive}
                title={row.label}
              />
              <span className="text-right text-[14px] text-[#14181f] tabular-nums [grid-area:pct]">
                {row.percentOfTotal}%
              </span>
              <ChevronDown
                aria-hidden
                className={`text-[#726f6f] transition-transform duration-200 [grid-area:chev] motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
                size={16}
              />
            </button>
            {open ? (
              <div className="flex flex-col gap-3 px-4 pt-1 pb-4" id={panelId}>
                <p className="m-0 flex gap-2.5 rounded-[10px] bg-[#edf2fd] p-3.5 text-[13px] leading-5 text-[#1f3d7a] animate-in fade-in slide-in-from-top-1 duration-300 motion-reduce:animate-none">
                  <Sparkles aria-hidden className="mt-0.5 shrink-0 text-[#1e55c5]" fill="currentColor" size={15} />
                  <span>
                    <span className="font-semibold">AI summary: </span>
                    {sample.topicSummaries[row.id]}
                  </span>
                </p>
                {shown.length > 0 ? (
                  <ul className="m-0 flex list-none flex-col gap-2 p-0">
                    {shown.map((quote) => (
                      <li
                        className="flex items-start gap-2 rounded-[10px] border border-[#e9eaed] bg-white px-3.5 py-2.5 text-[13px] leading-5 text-[#14181f]"
                        key={quote}
                      >
                        <MessageSquareText aria-hidden className="mt-0.5 shrink-0 text-[#726f6f]" size={14} />
                        “{quote}”
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

/** The app's Themes tab on sample data: the proof under the hero. */
function DashboardPicture({ sample }: { sample: LandingSample }) {
  const rows = dashboardRows(sample)
  const totals = rows.reduce(
    (sum, row) => ({ negative: sum.negative + row.negative, neutral: sum.neutral + row.neutral, positive: sum.positive + row.positive }),
    { negative: 0, neutral: 0, positive: 0 },
  )
  const allMentions = totals.negative + totals.neutral + totals.positive
  const share = (n: number) => `${(n / allMentions) * 100}%`
  const flagged = sample.whatChanged.rows.reduce((sum, row) => sum + row.violations, 0)
  return (
    <AppFrame sample={sample} tab="Themes">
          <div className="grid grid-cols-[1fr_1.3fr_1fr] gap-3 max-[700px]:grid-cols-1">
            <div className="rounded-[10px] border border-[#e9eaed] px-3.5 py-3">
              <p className="m-0 text-[12px] font-medium text-[#726f6f]">Total responses</p>
              <p className="m-0 mt-1 text-[20px] font-bold text-[#14181f] tabular-nums">{sample.responseCount}</p>
            </div>
            <div className="rounded-[10px] border border-[#e9eaed] px-3.5 py-3">
              <p className="m-0 text-[12px] font-medium text-[#726f6f]">Overall sentiment</p>
              <div
                aria-label={`Negative ${Math.round((totals.negative / allMentions) * 100)}%, neutral ${Math.round((totals.neutral / allMentions) * 100)}%, positive ${Math.round((totals.positive / allMentions) * 100)}%`}
                className="mt-3 flex h-2.5 gap-0.5 overflow-hidden rounded-full"
                role="img"
              >
                <span style={{ width: share(totals.negative), backgroundColor: SENTIMENT_COLORS.negative }} />
                <span style={{ width: share(totals.neutral), backgroundColor: SENTIMENT_COLORS.neutral }} />
                <span style={{ width: share(totals.positive), backgroundColor: SENTIMENT_COLORS.positive }} />
              </div>
            </div>
            <div className="rounded-[10px] border border-[#e9eaed] px-3.5 py-3">
              <p className="m-0 text-[12px] font-medium text-[#726f6f]">Violation mentions</p>
              <p className="m-0 mt-1 flex items-baseline gap-2">
                <span className="text-[20px] font-bold text-[#14181f] tabular-nums">{flagged}</span>
                <span className="text-[12px] font-semibold text-[#c2365f]">{flagged} to review</span>
              </p>
            </div>
          </div>
          <div className="rounded-[10px] border border-[#e9eaed] py-1.5">
            <div className="flex items-center justify-between px-4 pt-2 pb-2.5 text-[13px] font-semibold text-[#14181f]">
              <span className="flex flex-wrap items-baseline gap-x-2">
                Topics found by AI ({rows.length})
                <span className="text-[12px] font-normal text-[#726f6f]">Click a topic to read it</span>
              </span>
              {/* Over the share column: the chevron column and its gap sit to its right. */}
              <span className="mr-8 font-medium text-[#726f6f]">Share</span>
            </div>
            {/* Keyed: switching sample closes any open topic. */}
            <TopicRows key={sample.formTitle} rows={rows} sample={sample} />
          </div>
    </AppFrame>
  )
}

// Where each loose answer floats around the hero dashboard: side, height, depth (scroll speed), tilt.
// Heights in px from the top, not %: opening a topic makes the dashboard taller, and the answers must not move with it.
const FLOATING_SPOTS = [
  { side: 'left', top: '30px', inset: '1%', depth: 1.1, tilt: '-3deg' },
  { side: 'left', top: '230px', inset: '0%', depth: 0.45, tilt: '2deg' },
  { side: 'left', top: '430px', inset: '1.5%', depth: 0.8, tilt: '-1.5deg' },
  { side: 'right', top: '70px', inset: '0.5%', depth: 0.6, tilt: '2.5deg' },
  { side: 'right', top: '270px', inset: '1.5%', depth: 1.2, tilt: '-2deg' },
  { side: 'right', top: '470px', inset: '0%', depth: 0.5, tilt: '1.5deg' },
] as const

/**
 * Parallax: loose sample answers in the gutters beside the dashboard, each drifting up at its
 * own depth as the page scrolls (index.css). Decorative repeats of the sample, so hidden from
 * assistive tech, and only drawn from 1440px wide (room beside the frame) with motion welcome.
 */
function FloatingAnswers({ sample }: { sample: LandingSample }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {FLOATING_SPOTS.map((spot, i) => {
        const comment = sample.comments[i]
        if (!comment) return null
        return (
          <p
            className="parallax-answer absolute m-0 w-48 items-start gap-2 rounded-[10px] border border-[#e8eaf1] bg-white px-3 py-2.5 text-[12px] leading-4.5 text-[#3f4045] shadow-[0_8px_24px_rgba(20,40,90,0.08)]"
            key={comment.text}
            style={
              {
                top: spot.top,
                [spot.side]: spot.inset,
                rotate: spot.tilt,
                '--depth': spot.depth,
                '--tilt': spot.tilt,
              } as React.CSSProperties
            }
          >
            <MessageSquareText className="mt-0.5 shrink-0 text-[#1e55c5]" size={13} />“{comment.text}”
          </p>
        )
      })}
    </div>
  )
}

/** The opening: the headline and sign-in, then the app itself with what to notice. */
function Hero({
  title,
  intro,
  secondary,
  sample,
  sampleId,
  onSampleChange,
}: {
  title: string
  intro: React.ReactNode
  /** A second, quieter action under the sign-in. */
  secondary?: React.ReactNode
  sample: LandingSample
  sampleId: LandingSampleId
  onSampleChange: (id: LandingSampleId) => void
}) {
  return (
    <section className="mx-auto flex max-w-360 flex-col gap-14 px-6 pt-10 pb-24 max-[560px]:gap-10 max-[560px]:px-4 max-[560px]:pt-4 max-[560px]:pb-16">
      <div className="flex flex-col items-center gap-6 text-center">
        <h1 className="m-0 max-w-208 text-[52px] leading-[1.05] font-semibold tracking-[-0.02em] text-balance max-[560px]:text-[38px]">
          {title}
        </h1>
        <p className="m-0 max-w-160 text-[16px] leading-7 text-[#3f4045]">{intro}</p>
        <div className="flex w-full justify-center">
          <SignInAction />
        </div>
        {secondary}
        {/* The first thing HR asks about grievance data, answered next to the action. */}
        <p className="m-0 flex max-w-150 items-start gap-2 text-left text-[13px] leading-5 text-[#3f4045]">
          <ShieldCheck aria-hidden className="mt-0.5 shrink-0 text-[#1e55c5]" size={16} />
          Analysis runs on KMUTT's own servers. People you share results with don't see respondents' names unless
          you allow it.
        </p>
      </div>
      <div className="relative flex flex-col gap-5">
        <FloatingAnswers sample={sample} />
        <div className="flex justify-center">
          <SampleSwitch onChange={onSampleChange} value={sampleId} />
        </div>
        {/* Scroll-driven: leans back, then straightens as it scrolls into view (index.css). */}
        <div className="hero-rise relative z-10">
          <DashboardPicture sample={sample} />
        </div>
      </div>
    </section>
  )
}

/** The whole flow in three steps, each shown as the small piece of product it involves. */
function HowItWorks({ sample }: { sample: LandingSample }) {
  const step = 'flex flex-col gap-3'
  const label = 'm-0 flex items-center gap-2.5 text-[16px] font-semibold text-[#14181f]'
  const num =
    'flex size-6 shrink-0 items-center justify-center rounded-full bg-[#1e55c5] text-[12px] font-semibold text-white'
  const text = 'm-0 text-[14px] leading-5.5 text-[#3f4045]'
  const mock = 'rounded-[10px] border border-[#e8eaf1] bg-white p-3.5 shadow-[0_2px_8px_rgba(15,23,42,0.05)]'
  // Step 3 shows the sample's topic that's getting worse, with its real sentiment split.
  const worseId = sample.whatChanged.rows.find((row) => row.kind === 'worse')?.id
  const worse = sample.topics.find((topic) => topic.id === worseId) ?? sample.topics[0]!
  const total = worse.negative + worse.neutral + worse.positive
  const share = (n: number) => `${(n / total) * 100}%`
  return (
    <section aria-labelledby="how-title" className={SECTION}>
      <SectionIntro id="how-title" title="How it works">
        From one form to a short list of what to act on, in three steps.
      </SectionIntro>
      <ol className="m-0 mx-auto grid w-full max-w-224 list-none grid-cols-3 gap-8 p-0 max-[900px]:grid-cols-1">
        <li>
          <Reveal className={step} delay={0}>
          <h3 className={label}>
            <span className={num}>1</span>
            Ask
          </h3>
          <p className={text}>Build a form with open questions, choices and optional details like department.</p>
          <div className={mock} aria-hidden="true">
            <p className="m-0 text-[13px] font-medium text-[#14181f]">What's one thing we should change?</p>
            <div className="mt-2.5 h-8 rounded-[8px] border border-[#d2d8e5] bg-[#fafbfe]" />
          </div>
          </Reveal>
        </li>
        <li>
          <Reveal className={step} delay={110}>
          <h3 className={label}>
            <span className={num}>2</span>
            Share
          </h3>
          <p className={text}>Send the link. People answer from their phone or laptop in a couple of minutes.</p>
          <div className={`${mock} flex items-center justify-between gap-3`} aria-hidden="true">
            <span className="flex min-w-0 items-center gap-2 text-[13px] text-[#1e55c5]">
              <LinkIcon className="shrink-0" size={14} />
              <span className="truncate">opengnp.sit.kmutt.ac.th/f/…</span>
            </span>
            <span className="shrink-0 text-[13px] font-semibold text-[#14181f] tabular-nums">
              {sample.responseCount} <span className="font-normal text-[#726f6f]">responses</span>
            </span>
          </div>
          </Reveal>
        </li>
        <li>
          <Reveal className={step} delay={220}>
          <h3 className={label}>
            <span className={num}>3</span>
            Read
          </h3>
          <p className={text}>AI groups every answer into topics and shows how people feel and what changed.</p>
          <div className={`${mock} flex flex-col gap-2`} aria-hidden="true">
            <span className="flex items-center justify-between gap-3 text-[13px] text-[#14181f]">
              <span className="min-w-0 truncate">{worse.label}</span>
              <span className="flex shrink-0 items-center gap-1 text-[12px] font-semibold text-[#e12b0c]">
                <TrendingUp size={13} />
                Getting worse
              </span>
            </span>
            <span className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
              <span style={{ width: share(worse.negative), backgroundColor: SENTIMENT_COLORS.negative }} />
              <span style={{ width: share(worse.neutral), backgroundColor: SENTIMENT_COLORS.neutral }} />
              <span style={{ width: share(worse.positive), backgroundColor: SENTIMENT_COLORS.positive }} />
            </span>
          </div>
          </Reveal>
        </li>
      </ol>
    </section>
  )
}

/** Workplace or open house: every sample demo on the page follows this. */
function SampleSwitch({ value, onChange }: { value: LandingSampleId; onChange: (id: LandingSampleId) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
      <span className="text-[13px] font-medium text-[#3f4045]" id="sample-switch-label">
        Example feedback from:
      </span>
      <div
        aria-labelledby="sample-switch-label"
        className="inline-flex rounded-full border border-[#d2d8e5] bg-white p-1"
        role="group"
      >
        {LANDING_SAMPLE_OPTIONS.map((option) => (
          <button
            aria-pressed={option.id === value}
            className={`h-8 cursor-pointer rounded-full px-3.5 text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e55c5] ${
              option.id === value ? 'bg-[#1e55c5] text-white' : 'text-[#3f4045] hover:bg-[#f7f8fb]'
            }`}
            key={option.id}
            onClick={() => onChange(option.id)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

const NAV_LINK =
  'rounded-[10px] px-3 py-2 text-[14px] font-semibold text-[#1e55c5] hover:bg-[#e8eefc] focus-visible:outline-2 focus-visible:outline-[#1e55c5]'

function SiteHeader({ page }: { page: 'landing' | 'demo' }) {
  const signedIn = useAuth().status === 'ready'
  return (
    <header className="mx-auto flex max-w-300 items-center justify-between px-6 py-5 max-[560px]:px-4">
      <Link aria-label={`${brand.name} overview`} className="rounded-[6px] focus-visible:outline-2 focus-visible:outline-[#1e55c5]" to="/about">
        <img alt={brand.name} className="h-9 w-17.25 object-cover object-center" src={brand.logo} />
      </Link>
      <nav aria-label="Site" className="flex items-center gap-1">
        {page === 'landing' ? (
          <Link className={NAV_LINK} to="/demo">
            See the demo
          </Link>
        ) : (
          <Link className={NAV_LINK} to="/about">
            Overview
          </Link>
        )}
        <Link className={NAV_LINK} to={signedIn ? '/' : '/login'}>
          {signedIn ? 'Go to home' : 'Sign in'}
        </Link>
      </nav>
    </header>
  )
}

function ClosingBand({ demoLink = false, trustLine = true }: { demoLink?: boolean; trustLine?: boolean }) {
  return (
    <section className="bg-[#1e55c5] text-white">
      <div className="mx-auto flex max-w-180 flex-col items-center gap-6 px-6 py-20 text-center max-[560px]:px-4 max-[560px]:py-16">
        <h2 className="m-0 text-[32px] leading-[1.15] font-semibold tracking-[-0.01em] text-balance">
          Ask your first question today.
        </h2>
        {trustLine ? (
          <p className="m-0 flex items-start gap-2.5 text-left text-[16px] leading-6.5 text-[#dbe6ff]">
            <ShieldCheck className="mt-1 shrink-0 text-white" size={18} />
            {brand.name}'s AI runs on KMUTT's own servers. Responses are never sent to outside AI services such as
            ChatGPT or Gemini.
          </p>
        ) : null}
        <div className="flex w-full justify-center">
          <SignInAction tone="blue" />
        </div>
        {demoLink ? (
          <Link
            className="inline-flex items-center gap-1.5 rounded-[6px] text-[14px] font-semibold text-white underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            to="/demo"
          >
            Or see the full demo first
            <ArrowRight size={16} />
          </Link>
        ) : null}
      </div>
    </section>
  )
}

function SiteFooter() {
  return (
    <footer className="mx-auto flex max-w-300 flex-wrap items-center justify-between gap-3 px-6 py-8 text-[12px] text-[#726f6f] max-[560px]:px-4">
      <span className="flex flex-wrap gap-x-4 gap-y-1">
        <span>© {new Date().getFullYear()} {brand.name}</span>
        <span>School of Information Technology, KMUTT</span>
      </span>
      <span className="flex gap-4">
        <Link className={linkClass} to="/terms">
          Terms of Use
        </Link>
        <Link className={linkClass} to="/privacy">
          Privacy Notice
        </Link>
      </span>
    </footer>
  )
}

const HERO_INTRO = (
  <>
    Send one form. {brand.name} reads every open answer and sorts it into topics, sentiment and what changed since
    last time, so you know where to act first.
  </>
)

/**
 * Eases its content in the first time it scrolls into view, from below or from a side.
 * Only with motion allowed: under reduced motion (or without IntersectionObserver) it's simply there.
 */
function Reveal({
  children,
  from = 'below',
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  from?: 'below' | 'left' | 'right'
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(() => typeof IntersectionObserver === 'undefined')
  useEffect(() => {
    const el = ref.current
    if (!el || shown) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -12% 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [shown])
  const hidden =
    from === 'left' ? 'motion-safe:-translate-x-8' : from === 'right' ? 'motion-safe:translate-x-8' : 'motion-safe:translate-y-6'
  return (
    <div
      className={cn(
        'motion-safe:transition-[opacity,translate] motion-safe:duration-700 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)]',
        shown ? 'translate-0 opacity-100' : cn('motion-safe:opacity-0', hidden),
        className,
      )}
      ref={ref}
      style={{ transitionDelay: shown ? `${delay}ms` : undefined }}
    >
      {children}
    </div>
  )
}

/** One selling point: what the visitor gains, beside the slice of the app that delivers it. */
function SellingPoint({
  title,
  children,
  visual,
  flip = false,
  stillVisual = false,
}: {
  title: string
  children: React.ReactNode
  visual: React.ReactNode
  flip?: boolean
  /** The visual has its own scroll-driven motion, so it doesn't slide in too. */
  stillVisual?: boolean
}) {
  return (
    <div className="grid grid-cols-2 items-center gap-14 max-[900px]:grid-cols-1 max-[900px]:gap-8">
      <Reveal className={`flex flex-col gap-4 ${flip ? 'min-[901px]:order-2' : ''}`} from={flip ? 'right' : 'left'}>
        <h2 className="m-0 text-[32px] leading-[1.15] font-semibold tracking-[-0.01em] text-balance">{title}</h2>
        <p className="m-0 text-[16px] leading-7 text-[#3f4045]">{children}</p>
      </Reveal>
      {stillVisual ? (
        <div className="min-w-0">{visual}</div>
      ) : (
        <Reveal className="min-w-0" delay={120} from={flip ? 'left' : 'right'}>
          {visual}
        </Reveal>
      )}
    </div>
  )
}

/** The three things a buyer gets, each proved by a working slice of the app on sample data. */
function SellingPoints({ sample }: { sample: LandingSample }) {
  const rows = dashboardRows(sample)
  const flagged = sample.flaggedPoint
  const [point, setPoint] = useState<FeedbackPoint>(flagged)
  const review = async (status: ViolationReview) =>
    setPoint(
      status === 'confirmed'
        ? { ...flagged, violationStatus: 'confirmed', reviewedBy: 'you' }
        : status === 'dismissed'
          ? { ...flagged, violation: false, dismissed: true, reviewedBy: 'you' }
          : flagged,
    )
  const card = 'rounded-[15px] border border-[#e3e7f0] bg-white shadow-[0_24px_60px_rgba(20,40,90,0.10)]'
  return (
    <section aria-label="What you get" className="mx-auto flex max-w-300 flex-col gap-24 overflow-x-clip px-6 py-24 max-[560px]:gap-16 max-[560px]:px-4 max-[560px]:py-16">
      <SellingPoint
        stillVisual
        title="Stop reading every answer one by one."
        visual={
          <div className={`${card} flex flex-col gap-2.5 p-5`}>
            <div className="flex items-center justify-between gap-3 pb-1">
              <span className="text-[13px] font-semibold text-[#14181f]">
                {sample.responseCount} answers in, {rows.length} topics out
              </span>
              <SampleTag />
            </div>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {sample.comments.slice(0, 4).map((comment) => (
                <li className="flex flex-col gap-1.5 rounded-[10px] bg-[#f7f8fb] px-3.5 py-3" key={comment.text}>
                  <span className="text-[14px] leading-5 text-[#14181f]">“{comment.text}”</span>
                  <span className="file-step flex items-center gap-1 text-[12px] font-medium text-[#1e55c5]">
                    <ArrowRight aria-hidden size={12} />
                    Filed under {rows.find((row) => row.id === comment.topicId)?.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        }
      >
        {brand.name} reads every open answer and groups it into topics, with how people feel about each. Hundreds of
        comments become one short list you can take in at a glance.
      </SellingPoint>
      <SellingPoint flip title="Know what got worse before it becomes a problem." visual={<WhatChangedCard data={sample.whatChanged} />}>
        Each month is compared with the last. Only the topics that clearly got worse, got better, or are new are
        called out, so you know where to look first.
      </SellingPoint>
      <SellingPoint
        title="Catch serious complaints early. You make the call."
        visual={
          <div className={`${card} flex flex-col gap-3 p-5`}>
            <div className="flex items-center justify-between gap-3">
              <p className="m-0 flex items-center gap-2 text-[16px] font-semibold text-[#14181f]">
                {sample.flaggedTopic}
                {point.violation ? (
                  <TriangleAlert aria-label="Contains possible violations" className="shrink-0 text-[#e0507a]" role="img" size={16} />
                ) : null}
              </p>
              <SampleTag />
            </div>
            <FeedbackPointCard onReview={review} point={point} query="" showName={false} />
          </div>
        }
      >
        Comments that may break the law or your organisation's values are flagged for you. The AI can be wrong, so
        you confirm or dismiss each flag, and a dismissed one drops out of every count. Try it here.
      </SellingPoint>
    </section>
  )
}

const TRUST = [
  {
    icon: Server,
    title: 'Stays at KMUTT',
    text: "Analysis runs on KMUTT's own servers. Responses are never sent to outside AI services such as ChatGPT or Gemini.",
  },
  {
    icon: EyeOff,
    title: 'Names stay private',
    text: "People you share results with don't see respondents' names unless you allow it.",
  },
  {
    icon: UserCheck,
    title: 'You stay in charge',
    text: 'The AI suggests and you decide. Every flag can be confirmed or dismissed, and every number opens to the comments behind it.',
  },
]

function TrustSection() {
  return (
    <section aria-labelledby="trust-title" className={SECTION}>
      <SectionIntro id="trust-title" title="Built for sensitive feedback.">
        Grievances and honest feedback need care. This is how {brand.name} handles them.
      </SectionIntro>
      <ul className="m-0 mx-auto grid w-full max-w-224 list-none grid-cols-3 gap-10 p-0 max-[900px]:grid-cols-1 max-[900px]:gap-8">
        {TRUST.map(({ icon: Icon, title, text }, i) => (
          <li className="border-t border-[#d2d8e5] pt-5" key={title}>
            <Reveal className="flex flex-col gap-2.5" delay={i * 110}>
              <Icon aria-hidden className="text-[#1e55c5]" size={22} />
              <p className="m-0 text-[16px] font-semibold text-[#14181f]">{title}</p>
              <p className="m-0 text-[14px] leading-5.5 text-[#3f4045]">{text}</p>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  )
}

const PAGE = 'min-h-screen bg-[#f5f9ff] text-[#14181f] selection:bg-[#cfe0ff]'

/** "/" for signed-out visitors, and /about for anyone: why to use it, proved with sample data, and the sign-in. */
export function LandingPage() {
  const [sampleId, setSampleId] = useState<LandingSampleId>('workplace')
  const sample = LANDING_SAMPLES[sampleId]
  return (
    <div className={PAGE}>
      <SiteHeader page="landing" />
      <main>
        <Hero
          intro={HERO_INTRO}
          onSampleChange={setSampleId}
          sample={sample}
          sampleId={sampleId}
          secondary={
            <Link className={`${NAV_LINK} inline-flex items-center gap-1.5`} to="/demo">
              See the full demo
              <ArrowRight size={16} />
            </Link>
          }
          title="Know what your people are really telling you."
        />
        <div className="border-t border-[#e8eaf1]">
          <SellingPoints key={sampleId} sample={sample} />
        </div>
        <div className="border-t border-[#e8eaf1]">
          <HowItWorks sample={sample} />
        </div>
        <div className="border-t border-[#e8eaf1]">
          <TrustSection />
        </div>
        {/* The trust section just said it; the band only asks. */}
        <ClosingBand demoLink trustLine={false} />
      </main>
      <SiteFooter />
    </div>
  )
}

const DEMO_TAB =
  'flex h-full items-center justify-center border-0 border-b-2 px-5 text-[16px] tracking-[0.16px] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#1e55c5] max-[560px]:px-3 max-[560px]:text-[14px]'

/** The demo's top bar: the app's Edit form | Dashboard tabs, a sample label and the sign-in. */
function DemoBar({ editing }: { editing: boolean }) {
  const tab = (active: boolean) =>
    cn(DEMO_TAB, active ? 'border-[#1e55c5] bg-[#edf2fd] font-medium text-[#1e55c5]' : 'border-transparent text-[#726f6f] hover:text-[#14181f]')
  return (
    <div className="flex h-12.5 items-center justify-between gap-3 border-b border-[#e8eaf1] pr-6 pl-4 max-[560px]:pr-3 max-[560px]:pl-2">
      <div className="flex h-full min-w-0 items-center gap-3">
        <Link
          aria-label={`${brand.name} overview`}
          className="shrink-0 rounded-[6px] focus-visible:outline-2 focus-visible:outline-[#1e55c5]"
          to="/about"
        >
          <img alt={brand.name} className="h-7 w-13.5 object-cover object-center" src={brand.logo} />
        </Link>
        <nav aria-label="Sample form" className="flex h-full">
          <Link aria-current={editing ? 'page' : undefined} className={tab(editing)} to="/demo?mode=edit">
            Edit form
          </Link>
          <Link aria-current={editing ? undefined : 'page'} className={tab(!editing)} to="/demo">
            Dashboard
          </Link>
        </nav>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          className="inline-flex h-8 items-center rounded-[10px] bg-[#1e55c5] px-3 text-[13px] font-semibold text-white transition-colors hover:bg-[#1a49aa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e55c5]"
          to="/login"
        >
          Sign in
        </Link>
      </div>
    </div>
  )
}

/**
 * /demo: a sample form to explore before signing up, in place of a starter form in every
 * new account. "Edit form" is the real editor and "Dashboard" the real dashboard (with its
 * tour), both on sample data; edits live in this page only and are never saved.
 */
export function DemoPage() {
  const [params] = useSearchParams()
  const editing = params.get('mode') === 'edit'
  // Held here, so switching tabs keeps what the visitor changed.
  const { model, update } = useFormEditorModel(SAMPLE_FORM_MODEL)
  const { settings, updateSettings } = useFormAccessSettings()
  return (
    <div className="min-h-screen bg-[#f5f9ff]">
      <HeadroomBar>
        <DemoBar editing={editing} />
      </HeadroomBar>
      {/* On both tabs: what to try here, that it's a sample, and the way to your own form. */}
      <p className="m-0 border-b border-[#f3d27a] bg-[#fff6d6] px-6 py-2.5 text-center text-[13px] text-[#7a5a00] max-[560px]:px-4">
        {editing
          ? 'Try it: rename questions, add options or new questions.'
          : 'Try it: open a topic, filter the results or review a flag.'}{' '}
        Nothing here is saved.{' '}
        <Link className="font-semibold text-[#7a5a00] underline underline-offset-2" to="/login">
          Sign in
        </Link>{' '}
        to build your own form.
      </p>
      {editing ? (
        <>
          <CreateFormPage
            formAccessSettings={settings}
            formModel={model}
            onCloseSettings={() => {}}
            onUpdateFormAccessSettings={updateSettings}
            onUpdateFormModel={update}
            showSettings={false}
          />
        </>
      ) : (
        <FormDashboardPage demo />
      )}
    </div>
  )
}
