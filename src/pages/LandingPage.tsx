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
  Users,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import type { ViolationReview } from '../api/analytics'
import { FeedbackPointCard } from '../components/dashboard/FeedbackSegmentSection'
import { SentimentBar } from '../components/dashboard/SentimentBar'
import { SENTIMENT_COLORS } from '../components/dashboard/sentimentColors'
import { WhatChangedCard } from '../components/dashboard/TrendView'
import { ViolationTooltip } from '../components/dashboard/ViolationTooltip'
import { ChangeTag } from '../components/dashboard/TopicSentimentCard'
import { StatCard } from '../components/dashboard/StatCard'
import { MicrosoftSignInButton } from '../components/MicrosoftSignInButton'
import { Button } from '../components/ui/button'
import { brand } from '../data/dashboard'
import type { FeedbackPoint } from '../data/dashboardAnalytics'
import { LANDING_SAMPLES, type LandingSample, type LandingTopic } from '../data/landingSample'
import { EditFormPage } from './EditFormPage'
import { FormDashboardPage } from './FormDashboardPage'
import { showAlert } from '../lib/alertDialog'
import { formQuery, responsesQuery, themesQuery, trendQuery } from '../api/queries'
import { DEMO_FORM_ID, DemoContext, demoSaveError } from '../lib/demo'
import { useAuth } from '../lib/auth'
import { msalInstance } from '../lib/msal'
import { cn } from '../lib/utils'
import askMascot from '../assets/step3-mascot.png'
import shareMascot from '../assets/step2-mascot.png'
import readMascot from '../assets/step1-mascot.png'
import penguinMascot from '../assets/card1-mascot.png'
import monkeyMascot from '../assets/card2-mascot.png'
import slothMascot from '../assets/card3-mascot.png'

// Largest sample topic (42 points) rounded up to a step of 10, as the dashboard's axis does.
const AXIS_MAX = 50

const linkClass =
  'rounded-[4px] text-[#1e55c5] underline-offset-3 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e55c5]'

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
        <Link
          className={
            tone === 'blue' ? cn(linkClass, 'text-white underline focus-visible:outline-white') : linkClass
          }
          to="/terms"
        >
          Terms of Use
        </Link>{' '}
        and acknowledge the{' '}
        <Link
          className={
            tone === 'blue' ? cn(linkClass, 'text-white underline focus-visible:outline-white') : linkClass
          }
          to="/privacy"
        >
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
  // sample.topics is already in the dashboard's Priority order.
  return rows
}

/** The app's window, as every demo on this page shows it: chrome, the form's name, its view tabs. */
function AppFrame({
  sample,
  className = '',
  children,
}: {
  sample: LandingSample
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      aria-label={`Sample dashboard for ${sample.formTitle}`}
      className={`mx-auto w-full max-w-224 min-w-0 overflow-hidden rounded-[15px] border border-[#e3e7f0] bg-white shadow-[0_24px_60px_rgba(20,40,90,0.12)] ${className}`}
      role="group"
    >
      <div
        aria-hidden="true"
        className="flex h-9 items-center gap-1.5 border-b border-[#eef0f4] bg-[#f7f8fb] px-3.5"
      >
        <span className="size-2.5 rounded-full bg-[#d9dde6]" />
        <span className="size-2.5 rounded-full bg-[#d9dde6]" />
        <span className="size-2.5 rounded-full bg-[#d9dde6]" />
      </div>
      <div className="flex flex-col gap-4 p-6 max-[560px]:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="m-0 text-[20px] font-semibold text-[#14181f]">{sample.formTitle}</p>
          <Link
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#1e55c5] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e55c5]"
            to="/demo"
          >
            Open the full demo
            <ArrowRight aria-hidden size={14} />
          </Link>
        </div>
        {/* Themes only, and no tabs: the hero makes one point, and tabs here would invite clicks. */}
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
function TopicRows({
  rows,
  sample,
  highlightId = null,
  onOpenChange,
}: {
  rows: DashboardRow[]
  sample: LandingSample
  /** A floating answer is hovered: light the topic it was filed under. */
  highlightId?: string | null
  /** Tells the hero which topic is open, so the floating answers filed there light up. */
  onOpenChange?: (topicId: string | null) => void
}) {
  const [openId, setOpenIdState] = useState<string | null>(null)
  const setOpenId = (id: string | null) => {
    setOpenIdState(id)
    onOpenChange?.(id)
  }
  return (
    <ul className="m-0 list-none p-0">
      {rows.map((row) => {
        const open = openId === row.id
        const highlighted = highlightId === row.id && !open
        const panelId = `topic-${row.id}-details`
        // The answers filed under this topic; a new topic only has What changed's quote.
        const quotes = sample.comments
          .filter((comment) => comment.topicId === row.id)
          .map((comment) => comment.text)
        const fallback = sample.whatChanged.rows.find((changed) => changed.id === row.id)?.quote
        const shown = (quotes.length > 0 ? quotes : fallback ? [fallback] : []).slice(0, 3)
        return (
          <li
            className={`border-l-[3px] transition-colors ${
              open
                ? 'border-[#1e55c5] bg-[#f7f8fb]'
                : highlighted
                  ? 'border-[#1e55c5] bg-[#edf2fd]'
                  : row.hasViolation
                    ? 'border-transparent bg-[#fff7f8]'
                    : 'border-transparent'
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
                  <ViolationTooltip focusable={false} scope="topic">
                    <TriangleAlert
                      aria-label="Contains possible violations"
                      className="flag-pulse shrink-0 text-[#e0507a]"
                      role="img"
                      size={15}
                    />
                  </ViolationTooltip>
                ) : null}
                {row.change ? (
                  <ChangeTag
                    changes={{
                      current: sample.whatChanged.currentLabel,
                      previous: sample.whatChanged.previousLabel,
                      kinds: {},
                    }}
                    kind={row.change}
                  />
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
                  <Sparkles
                    aria-hidden
                    className="mt-0.5 shrink-0 text-[#1e55c5]"
                    fill="currentColor"
                    size={15}
                  />
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
function DashboardPicture({
  sample,
  highlightId = null,
  onOpenChange,
}: {
  sample: LandingSample
  highlightId?: string | null
  onOpenChange?: (topicId: string | null) => void
}) {
  const rows = dashboardRows(sample)
  const totals = rows.reduce(
    (sum, row) => ({
      negative: sum.negative + row.negative,
      neutral: sum.neutral + row.neutral,
      positive: sum.positive + row.positive,
    }),
    { negative: 0, neutral: 0, positive: 0 },
  )
  const allMentions = totals.negative + totals.neutral + totals.positive
  const share = (n: number) => `${(n / allMentions) * 100}%`
  const violationTopics = sample.topics.filter((topic) => topic.hasViolation).length
  return (
    <AppFrame sample={sample}>
      {/* The dashboard's own cards; @container lets them rearrange in a narrow frame as they do there. */}
      <div className="@container">
        <div className="grid grid-cols-[1fr_1.3fr_1fr] gap-3 max-[700px]:grid-cols-1">
          <StatCard
            deltaClassName="text-[#0b842d]"
            icon={<Users className="text-[#1e55c5]" size={31} strokeWidth={1.8} />}
            iconBgClassName="bg-[#edf2fd]"
            label="Total responses"
            value={sample.responseCount}
          />
          <div className="flex h-29.5 min-w-0 flex-col rounded-[10px] border border-[#e9eaed] px-3.75 pt-4">
            <p className="m-0 text-[12px] font-medium text-[#726f6f]">Overall sentiment</p>
            <div
              aria-label={`Negative ${Math.round((totals.negative / allMentions) * 100)}%, neutral ${Math.round((totals.neutral / allMentions) * 100)}%, positive ${Math.round((totals.positive / allMentions) * 100)}%`}
              className="mt-auto mb-auto flex h-2.5 gap-0.5 overflow-hidden rounded-full"
              role="img"
            >
              <span style={{ width: share(totals.negative), backgroundColor: SENTIMENT_COLORS.negative }} />
              <span style={{ width: share(totals.neutral), backgroundColor: SENTIMENT_COLORS.neutral }} />
              <span style={{ width: share(totals.positive), backgroundColor: SENTIMENT_COLORS.positive }} />
            </div>
          </div>
          <StatCard
            deltaClassName="text-[#881921]"
            footer={
              sample.reviewCount > 0 ? (
                <span className="font-semibold whitespace-nowrap text-[#c2365f]">
                  {sample.reviewCount} to review
                </span>
              ) : (
                <span className="whitespace-nowrap text-[#726f6f]">All reviewed</span>
              )
            }
            icon={<TriangleAlert className="text-[#e0507a]" size={28} strokeWidth={1.8} />}
            iconBgClassName="bg-[#ffeaeb]"
            label="Violation mentions"
            note={`in ${violationTopics} ${violationTopics === 1 ? 'topic' : 'topics'}`}
            value={sample.violationMentions}
          />
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
        <TopicRows
          highlightId={highlightId}
          key={sample.formTitle}
          onOpenChange={onOpenChange}
          rows={rows}
          sample={sample}
        />
      </div>
    </AppFrame>
  )
}

// Where each loose answer floats around the hero dashboard: side, height, gap from the frame's edge,
// how far it drops to the dashboard, how far it then rises, tilt.
// Heights in px from the top of the sample switch (negative: up beside the headline), not %: opening a topic makes the dashboard taller, and the answers must not move with it.
// Answers start spread up the hero and drop to land beside the dashboard; higher ones drop further, so none passes another.
// Then they rise, higher ones faster, so the stack spreads apart.
const FLOATING_SPOTS = [
  { side: 'left', top: '-440px', gap: '2rem', drop: '480px', lift: '260px', tilt: '-3deg' },
  { side: 'left', top: '20px', gap: '3rem', drop: '240px', lift: '180px', tilt: '2deg' },
  { side: 'left', top: '470px', gap: '1.5rem', drop: '10px', lift: '100px', tilt: '-1.5deg' },
  { side: 'right', top: '-320px', gap: '2.5rem', drop: '420px', lift: '240px', tilt: '2.5deg' },
  { side: 'right', top: '110px', gap: '1.5rem', drop: '210px', lift: '160px', tilt: '-2deg' },
  { side: 'right', top: '520px', gap: '3rem', drop: '20px', lift: '90px', tilt: '1.5deg' },
] as const

/**
 * Parallax: loose sample answers in the gutters, spread up the hero, that drop to gather beside the
 * dashboard as the page scrolls (index.css). Hovering one lights the topic it was filed under.
 * Decorative repeats of the sample, so hidden from
 * assistive tech, and only drawn from 1440px wide (room beside the frame) with motion welcome.
 */
function FloatingAnswers({
  sample,
  activeTopic,
  onHoverTopic,
}: {
  sample: LandingSample
  activeTopic: string | null
  onHoverTopic: (topicId: string | null) => void
}) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {FLOATING_SPOTS.map((spot, i) => {
        const comment = sample.comments[i]
        if (!comment) return null
        return (
          <p
            className={`parallax-answer pointer-events-auto absolute m-0 w-48 cursor-default items-start gap-2 rounded-[10px] border bg-white px-3 py-2.5 text-[12px] leading-4.5 text-[#3f4045] transition-[border-color,box-shadow] duration-200 ${
              activeTopic === comment.topicId
                ? 'border-[#1e55c5] shadow-[0_10px_28px_rgba(30,85,197,0.18)]'
                : 'border-[#e8eaf1] shadow-[0_8px_24px_rgba(20,40,90,0.08)]'
            }`}
            key={comment.text}
            onMouseEnter={() => onHoverTopic(comment.topicId)}
            onMouseLeave={() => onHoverTopic(null)}
            style={
              {
                top: spot.top,
                // Outside the frame's edge (half of max-w-224 = 28rem), past the card's width (w-48 = 12rem), clear of it.
                [spot.side]: `calc(50% - 28rem - 12rem - ${spot.gap})`,
                rotate: spot.tilt,
                '--drop': spot.drop,
                '--lift': spot.lift,
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
}: {
  title: string
  intro: React.ReactNode
  /** A second, quieter action under the sign-in. */
  secondary?: React.ReactNode
  sample: LandingSample
}) {
  // A floating answer under the pointer, and so the topic to light in the dashboard.
  const [hoverTopic, setHoverTopic] = useState<string | null>(null)
  // The topic opened in the dashboard: its floating answers stay lit while it's open.
  const [openTopic, setOpenTopic] = useState<string | null>(null)
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
          Analysis runs on KMUTT's own servers. People you share results with don't see respondents' names
          unless you allow it.
        </p>
      </div>
      <div className="relative flex flex-col gap-5">
        <FloatingAnswers activeTopic={hoverTopic ?? openTopic} onHoverTopic={setHoverTopic} sample={sample} />
        {/* Scroll-driven: leans back, then straightens as it scrolls into view (index.css). */}
        {/* As wide as the frame only: full width, it would cover the floating answers in the gutters. */}
        <div className="hero-rise relative z-10 mx-auto w-full max-w-224">
          <DashboardPicture highlightId={hoverTopic} onOpenChange={setOpenTopic} sample={sample} />
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
  const art = 'h-30 w-auto self-start max-[900px]:h-24'
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
            <img alt="" className={art} src={askMascot} />
            <h3 className={label}>
              <span className={num}>1</span>
              Ask
            </h3>
            <p className={text}>
              Build a form with open questions, choices and optional details like department.
            </p>
            <div className={mock} aria-hidden="true">
              <p className="m-0 text-[13px] font-medium text-[#14181f]">What's one thing we should change?</p>
              <div className="mt-2.5 h-8 rounded-[8px] border border-[#d2d8e5] bg-[#fafbfe]" />
            </div>
          </Reveal>
        </li>
        <li>
          <Reveal className={step} delay={110}>
            <img alt="" className={art} src={shareMascot} />
            <h3 className={label}>
              <span className={num}>2</span>
              Share
            </h3>
            <p className={text}>
              Send the link. People answer from their phone or laptop in a couple of minutes.
            </p>
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
            <img alt="" className={art} src={readMascot} />
            <h3 className={label}>
              <span className={num}>3</span>
              Read
            </h3>
            <p className={text}>
              AI groups every answer into topics and shows how people feel and what changed.
            </p>
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

const NAV_LINK =
  'rounded-[10px] px-3 py-2 text-[14px] font-semibold text-[#1e55c5] hover:bg-[#e8eefc] focus-visible:outline-2 focus-visible:outline-[#1e55c5]'

function SiteHeader({ page }: { page: 'landing' | 'demo' }) {
  const signedIn = useAuth().status === 'ready'
  return (
    <header className="mx-auto flex max-w-300 items-center justify-between px-6 py-5 max-[560px]:px-4">
      <Link
        aria-label={`${brand.name} overview`}
        className="rounded-[6px] focus-visible:outline-2 focus-visible:outline-[#1e55c5]"
        to="/about"
      >
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
            {brand.name}'s AI runs on KMUTT's own servers. Responses are never sent to outside AI services
            such as ChatGPT or Gemini.
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
        <span>
          © {new Date().getFullYear()} {brand.name}
        </span>
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
    Send one form. {brand.name} reads every open answer and sorts it into topics, sentiment and what changed
    since last time, so you know where to act first.
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
    from === 'left'
      ? 'motion-safe:-translate-x-8'
      : from === 'right'
        ? 'motion-safe:translate-x-8'
        : 'motion-safe:translate-y-6'
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
      <Reveal
        className={`flex flex-col gap-4 ${flip ? 'min-[901px]:order-2' : ''}`}
        from={flip ? 'right' : 'left'}
      >
        <h2 className="m-0 text-[32px] leading-[1.15] font-semibold tracking-[-0.01em] text-balance">
          {title}
        </h2>
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
    // Clipped at the screen edge, not the section's: the slide-ins mustn't scroll a phone sideways, and the cards' glow needs the room.
    <div className="overflow-x-clip">
      <section
        aria-label="What you get"
        className="mx-auto flex max-w-300 flex-col gap-24 px-6 py-24 max-[560px]:gap-16 max-[560px]:px-4 max-[560px]:py-16"
      >
        <SellingPoint
          stillVisual
          title="Stop reading every answer one by one."
          visual={
            // Mascots behind a card come before it, those in front come after: the card is positioned, so DOM order sets the stacking.
            <div className="spot-card relative max-[900px]:mt-8 [--glow:rgb(30_85_197/0.2)]">
              <img alt="" className="absolute -top-[60px] right-8 w-35" src={penguinMascot} />
              <div className={`${card} relative flex flex-col gap-2.5 p-5`}>
                <div className="flex items-center justify-between gap-3 pb-1">
                  <span className="text-[13px] font-semibold text-[#14181f]">
                    {sample.responseCount} answers in, {rows.length} topics out
                  </span>
                </div>
                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                  {sample.comments.slice(0, 4).map((comment) => (
                    <li
                      className="flex flex-col gap-1.5 rounded-[10px] bg-[#f7f8fb] px-3.5 py-3"
                      key={comment.text}
                    >
                      <span className="text-[14px] leading-5 text-[#14181f]">“{comment.text}”</span>
                      <span className="file-step flex items-center gap-1 text-[12px] font-medium text-[#1e55c5]">
                        <ArrowRight aria-hidden size={12} />
                        Filed under {rows.find((row) => row.id === comment.topicId)?.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          }
        >
          {brand.name} reads every open answer and groups it into topics, with how people feel about each.
          Hundreds of comments become one short list you can take in at a glance.
        </SellingPoint>
        <SellingPoint
          flip
          title="Know what got worse before it becomes a problem."
          visual={
            <div className="spot-card relative max-[900px]:mt-22 [--glow:rgb(196_40_11/0.22)]">
              <img alt="" className="absolute -top-[114px] left-8 w-26" src={monkeyMascot} />
              <div className="relative">
                <WhatChangedCard data={sample.whatChanged} />
              </div>
            </div>
          }
        >
          Each week is compared with the one before. Only the topics that clearly got worse, got better, or
          are new are called out, so you know where to look first.
        </SellingPoint>
        <SellingPoint
          title="Catch serious complaints early. You make the call."
          visual={
            <div className="spot-card relative max-[900px]:mt-9 [--glow:rgb(224_80_122/0.26)]">
              <div className={`${card} relative flex flex-col gap-3 p-5`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="m-0 flex items-center gap-2 text-[16px] font-semibold text-[#14181f]">
                    {sample.flaggedTopic}
                    {point.violation ? (
                      <ViolationTooltip scope="topic">
                        <TriangleAlert
                          aria-label="Contains possible violations"
                          className="shrink-0 text-[#e0507a]"
                          role="img"
                          size={16}
                        />
                      </ViolationTooltip>
                    ) : null}
                  </p>
                </div>
                <FeedbackPointCard onReview={review} point={point} query="" showName={false} />
              </div>
              <img alt="" className="absolute -top-[64px] right-6 w-32" src={slothMascot} />
            </div>
          }
        >
          Comments that may break the law or your organisation's values are flagged for you. The AI can be
          wrong, so you confirm or dismiss each flag, and a dismissed one drops out of every count. Try it
          here.
        </SellingPoint>
      </section>
    </div>
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
  const sample = LANDING_SAMPLES.workplace
  const queryClient = useQueryClient()
  // Warm the cache so /demo opens without skeletons. Keys must match FormDashboardPage's unfiltered ones.
  useEffect(() => {
    void queryClient.prefetchQuery(formQuery(DEMO_FORM_ID))
    void queryClient.prefetchQuery(responsesQuery(DEMO_FORM_ID))
    void queryClient.prefetchQuery(themesQuery(DEMO_FORM_ID, { demo: {} }))
    void queryClient.prefetchQuery(trendQuery(DEMO_FORM_ID, { rank: 'mentioned', demo: {} }))
  }, [queryClient])
  return (
    <div className={PAGE}>
      <SiteHeader page="landing" />
      <main>
        <Hero
          intro={HERO_INTRO}
          sample={sample}
          secondary={
            <Link className={`${NAV_LINK} inline-flex items-center gap-1.5`} to="/demo">
              See the full demo
              <ArrowRight size={16} />
            </Link>
          }
          title="Know what your people are really telling you."
        />
        <div className="border-t border-[#e8eaf1]">
          <SellingPoints sample={sample} />
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

/**
 * /demo: the real editor and dashboard on the server's demo form, in place of a starter form
 * in every new account. Every control works; saving explains it needs an account (lib/demo.ts).
 */
export function DemoPage() {
  const [params] = useSearchParams()
  const editing = params.get('mode') === 'edit'
  return (
    <DemoContext.Provider value>
      <div className="min-h-screen bg-[#f5f9ff]">
        {/* Above the app's own bar: that this is the demo, and the ways out of it. */}
        <div className="flex items-center gap-4 border-b border-[#f3d27a] bg-[#fff6d6] px-6 py-2 text-[13px] text-[#7a5a00] max-[560px]:px-4">
          <Link
            aria-label={`${brand.name} overview`}
            className="shrink-0 rounded-[6px] focus-visible:outline-2 focus-visible:outline-[#1e55c5]"
            to="/about"
          >
            <img alt={brand.name} className="h-6 w-11.5 object-cover object-center" src={brand.logo} />
          </Link>
          <p className="m-0 min-w-0 flex-1 text-center">
            {editing
              ? 'Try it: rename questions, add options or open the settings.'
              : 'Try it: open a topic, filter the results, export or review a flag.'}{' '}
            Nothing here is saved.
          </p>
          <Link
            className="inline-flex h-8 shrink-0 items-center rounded-[10px] bg-[#1e55c5] px-3 text-[13px] font-semibold text-white transition-colors hover:bg-[#1a49aa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e55c5]"
            to="/login"
          >
            Sign in
          </Link>
        </div>
        {editing ? (
          <EditFormPage
            onMove={() => void showAlert(demoSaveError().message, { title: 'Sign in to move forms' })}
          />
        ) : (
          <FormDashboardPage />
        )}
      </div>
    </DemoContext.Provider>
  )
}
