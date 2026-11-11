import {
  ArrowRight,
  Check,
  ChevronDown,
  CornerDownRight,
  EyeOff,
  Heart,
  Home,
  Link as LinkIcon,
  LogOut,
  MessageSquareText,
  Server,
  Sparkles,
  TrendingUp,
  TriangleAlert,
  UserCheck,
  UserRound,
  Users,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import type { ViolationReview } from '../api/analytics'
import { FeedbackPointCard } from '../components/dashboard/FeedbackSegmentSection'
import { OverallSentimentCard } from '../components/dashboard/OverallSentimentCard'
import { SentimentBar } from '../components/dashboard/SentimentBar'
import { SENTIMENT_SCORE_OUT_OF, sentimentScore } from '../components/dashboard/sentimentScore'
import { SENTIMENT_COLORS } from '../components/dashboard/sentimentColors'
import { WhatChangedCard } from '../components/dashboard/TrendView'
import { ViolationTooltip } from '../components/dashboard/ViolationTooltip'
import { ChangeTag } from '../components/dashboard/TopicSentimentCard'
import { StatCard } from '../components/dashboard/StatCard'
import { MicrosoftSignInButton } from '../components/MicrosoftSignInButton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import { UserAvatar } from '../components/UserAvatar'
import { Button } from '../components/ui/button'
import { brand } from '../data/dashboard'
import type { FeedbackPoint } from '../data/dashboardAnalytics'
import { LANDING_SAMPLES, type LandingSample, type LandingTopic } from '../data/landingSample'
import { EditFormPage } from './EditFormPage'
import { FormDashboardPage } from './FormDashboardPage'
import { showAlert } from '../lib/alertDialog'
import { formQuery, responsesQuery, themesQuery, trendQuery } from '../api/queries'
import { DEMO_FORM_ID, DemoContext, demoSaveError } from '../lib/demo'
import { useAuth, type AuthUser } from '../lib/auth'
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
  const navigate = useNavigate()
  // Only a sign-in started here goes Home; someone already signed in can stay on /about.
  const signingIn = useRef(false)
  useEffect(() => {
    if (signedIn && signingIn.current) void navigate('/', { replace: true })
  }, [signedIn, navigate])
  if (signedIn) {
    return (
      <Button
        asChild
        // As tall as the sign-in button it replaces: primary (48px) on the light hero, default on the blue band.
        className={`w-full max-w-80 justify-center rounded-[10px] font-semibold ${
          tone === 'blue'
            ? 'h-10.5 bg-white text-[14px] text-[#1e55c5] hover:bg-[#e8eefc] focus-visible:ring-white'
            : 'h-12 text-[16px]'
        }`}
      >
        <Link to="/">Go to home</Link>
      </Button>
    )
  }
  return (
    <div className="flex w-full max-w-80 flex-col gap-3">
      {msalInstance ? (
        <MicrosoftSignInButton
          onBusyChange={(busy) => {
            if (busy) signingIn.current = true
          }}
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
  const rows: DashboardRow[] = sample.topics.map((topic) => ({
    ...topic,
    change: changes.get(topic.id),
  }))
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
        // Flagged first, as the dashboard lists them.
        const quotes = sample.comments
          .filter((comment) => comment.topicId === row.id)
          .sort((a, b) => Number(Boolean(b.violation)) - Number(Boolean(a.violation)))
        const fallback = sample.whatChanged.rows.find((changed) => changed.id === row.id)?.quote
        const shown = (quotes.length > 0 ? quotes : fallback ? [{ text: fallback }] : []).slice(0, 3)
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
                      className="shrink-0 text-[#e0507a]"
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
                        className={`flex items-start gap-2 rounded-[10px] border px-3.5 py-2.5 text-[13px] leading-5 text-[#14181f] ${
                          'violation' in quote && quote.violation
                            ? 'border-[#f6c6d3] bg-[#fff7f8]'
                            : 'border-[#e9eaed] bg-white'
                        }`}
                        key={quote.text}
                      >
                        {'violation' in quote && quote.violation ? (
                          <ViolationTooltip scope="point">
                            <TriangleAlert
                              aria-label="Flagged as a possible violation"
                              className="mt-0.5 shrink-0 text-[#e0507a]"
                              role="img"
                              size={14}
                            />
                          </ViolationTooltip>
                        ) : (
                          <MessageSquareText
                            aria-hidden
                            className="mt-0.5 shrink-0 text-[#726f6f]"
                            size={14}
                          />
                        )}
                        “{quote.text}”
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
          <OverallSentimentCard
            negative={totals.negative}
            neutral={totals.neutral}
            outOf={SENTIMENT_SCORE_OUT_OF}
            positive={totals.positive}
            score={sentimentScore(totals)}
          />
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
          <span className="flex flex-wrap items-center gap-x-2">
            <span className="flex items-center gap-1.5">
              <Sparkles aria-hidden className="shrink-0 text-[#1e55c5]" size={14} />
              Topics found by AI ({rows.length})
            </span>
            <span className="text-[12px] font-normal text-[#726f6f]">Click a topic to drill down</span>
          </span>
          {/* Over the weight column: the chevron column and its gap sit to its right. */}
          <span className="mr-8 font-medium text-[#726f6f]">Weight</span>
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

const TILTS = [-1.2, 0.8, -0.4, 1, -0.8]

/** Raw answers on the left, the topics AI filed them under on the right; steps through them until pointed at. */
function RawToRead({ sample }: { sample: LandingSample }) {
  // Single-topic answers, with the one split across two topics third, early enough to be seen.
  const singles = sample.comments.map((comment) => ({ text: comment.text, topicIds: [comment.topicId] }))
  const comments = (
    sample.splitComment ? [...singles.slice(0, 2), sample.splitComment, ...singles.slice(2)] : singles
  ).slice(0, TILTS.length)
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const activeTopics = comments[active]?.topicIds ?? []
  // Only the topics these answers were filed under, so the card stays about as tall as the list.
  const topics = sample.topics.filter((topic) => comments.some((comment) => comment.topicIds.includes(topic.id)))

  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => setActive((i) => (i + 1) % comments.length), 2600)
    return () => window.clearInterval(timer)
  }, [paused, comments.length])

  const pick = (i: number) => {
    setActive(i)
    setPaused(true)
  }

  return (
    <div className="grid grid-cols-[minmax(0,12rem)_auto_minmax(0,1fr)] items-center gap-2 max-[1000px]:grid-cols-1">
      <ul
        aria-label="Raw feedback: point at one to see its topic"
        className="m-0 flex list-none flex-col gap-2.5 p-0 max-[1000px]:hidden"
        onMouseLeave={() => setPaused(false)}
      >
        {comments.map((comment, i) => (
          <li
            className="animate-in fade-in slide-in-from-left-4 fill-mode-both duration-700 ease-out motion-reduce:animate-none"
            key={comment.text}
            style={{ animationDelay: `${i * 90}ms`, rotate: i === active ? '0deg' : `${TILTS[i]}deg` }}
          >
            <button
              aria-pressed={i === active}
              className={`flex w-full cursor-pointer items-start gap-2 rounded-[10px] border px-3 py-2.5 text-left text-[13px] leading-4.75 transition-[border-color,background-color,box-shadow,translate] duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e55c5] ${
                i === active
                  ? 'translate-x-1.5 border-[#1e55c5] bg-[#f5f8ff] text-[#14181f] shadow-[0_6px_16px_rgba(30,85,197,0.16)]'
                  : 'border-[#e8eaf1] bg-white text-[#3f4045] shadow-[0_2px_8px_rgba(15,23,42,0.05)]'
              }`}
              onBlur={() => setPaused(false)}
              onFocus={() => pick(i)}
              onMouseEnter={() => pick(i)}
              type="button"
            >
              <MessageSquareText className="mt-0.5 shrink-0 text-[#1e55c5]" size={14} />
              <span>“{comment.text}”</span>
            </button>
          </li>
        ))}
      </ul>

      <ArrowRight
        aria-hidden="true"
        className="text-[#8fc9ff] animate-in fade-in fill-mode-both delay-500 duration-500 motion-reduce:animate-none max-[1000px]:hidden"
        size={28}
      />

      {/* Narrow screens have no room for the list, so the current comment sits above the card. */}
      <p
        className="m-0 hidden items-start gap-2 rounded-[10px] border border-[#1e55c5] bg-[#f5f8ff] px-3 py-2.5 text-[13px] leading-4.75 text-[#14181f] max-[1000px]:flex"
        key={active}
      >
        <MessageSquareText className="mt-0.5 shrink-0 text-[#1e55c5]" size={14} />
        <span className="animate-in fade-in duration-500 motion-reduce:animate-none">“{comments[active]?.text}”</span>
      </p>

      <div className="flex flex-col gap-3">
      <section
        aria-label="Topics found in the sample feedback"
        className="flex flex-col rounded-[15px] border border-[#e9eaed] bg-white pt-5 pb-3 shadow-[0_16px_40px_rgba(30,85,197,0.10)] animate-in fade-in slide-in-from-right-4 fill-mode-both delay-500 duration-700 ease-out motion-reduce:animate-none"
      >
        <div className="flex items-center justify-between gap-3 px-5 pb-3">
          <h3 className="m-0 flex items-center gap-2 text-[14px] font-semibold text-black">
            <Sparkles aria-hidden className="shrink-0 text-[#1e55c5]" size={15} />
            Topics found by AI
          </h3>
        </div>
        <ul className="m-0 flex list-none flex-col p-0">
          {topics.map((topic) => {
            const isActive = activeTopics.includes(topic.id)
            return (
              <li
                className={`flex flex-col gap-1.5 border-l-[3px] py-2.5 pr-5 pl-4.25 transition-colors duration-300 ${
                  isActive ? 'border-[#1e55c5] bg-[#f7f8fb]' : topic.hasViolation ? 'border-transparent bg-[#fff7f8]' : 'border-transparent'
                }`}
                key={topic.id}
              >
                <span className="flex min-w-0 flex-1 items-center gap-2 text-[14px] text-[#14181f]">
                  <span className={`truncate ${isActive ? 'font-medium' : ''}`}>{topic.label}</span>
                  {topic.hasViolation ? (
                    <TriangleAlert aria-label="Contains possible violations" className="shrink-0 text-[#e0507a]" size={15} />
                  ) : null}
                  {isActive ? (
                    <span className="ml-auto shrink-0 text-[11px] font-semibold text-[#1e55c5]">Filed here</span>
                  ) : null}
                </span>
                <span className="flex items-center gap-3">
                  <SentimentBar
                    className="min-w-0 flex-1"
                    maxValue={AXIS_MAX}
                    negative={topic.negative}
                    neutral={topic.neutral}
                    positive={topic.positive}
                    title={topic.label}
                  />
                  <span className="w-12 text-right text-[14px] text-[#14181f] tabular-nums">{topic.percentOfTotal}%</span>
                </span>
              </li>
            )
          })}
        </ul>
      </section>
      {/* Says what the card shows: sample data, as under the dashboard further down. */}
      <p className="m-0 text-center text-[13px] font-medium tracking-[0.04em] text-[#726f6f] lowercase">
        Sample from {sample.responseCount} staff feedback responses
      </p>
      </div>
    </div>
  )
}

/** The opening: the headline and sign-in, then raw answers turning into topics. */
function Hero({
  title,
  intro,
  secondary,
  sample,
}: {
  title: React.ReactNode
  intro: React.ReactNode
  /** A second, quieter action under the sign-in. */
  secondary?: React.ReactNode
  sample: LandingSample
}) {
  // Wide screens: text on the left, the demo on the right, filling the first screen under the header (4.75rem),
  // with more room below than above so the content sits at the eye's centre, not the geometric one.
  // Narrower: stacked and centred.
  return (
    <section className="relative mx-auto grid max-w-[83rem] grid-cols-1 items-center gap-14 px-6 pt-10 pb-24 min-[1200px]:min-h-[calc(100svh-4.75rem)] min-[1200px]:grid-cols-[minmax(0,6fr)_minmax(0,7fr)] min-[1200px]:content-center min-[1200px]:gap-10 min-[1200px]:pt-4 min-[1200px]:pb-[max(4rem,12svh)] max-[560px]:gap-10 max-[560px]:px-4 max-[560px]:pt-4 max-[560px]:pb-16">
      <div className="flex flex-col items-center gap-6 text-center min-[1200px]:items-start min-[1200px]:text-left">
          {/* Three levels, each a step apart in size and contrast: eyebrow, headline, intro. */}
          {/* The eyebrow sits closer to the headline than the intro does, so the two read as one unit. */}
          <p className="m-0 -mb-3 flex items-center gap-2 text-[15px] font-medium text-[#1e55c5]">
            <span aria-hidden="true" className="h-3.5 w-0.5 rounded-full bg-[#1e55c5]" />
            Feedback analytics for your organization
          </p>
          <h1 className="m-0 max-w-208 text-[56px] leading-[1.05] font-semibold tracking-[-0.025em] text-balance text-[#14181f] min-[1200px]:text-[clamp(40px,3vw,46px)] max-[560px]:text-[38px]">
            {title}
          </h1>
          <p className="m-0 max-w-160 text-[18px] leading-7 text-balance text-[#3f4045]">
            {intro}
          </p>
          {/* Sign-in, with the demo beside it as the quieter second choice. */}
          <div className="flex w-full flex-wrap items-start justify-center gap-3 min-[1200px]:justify-start">
            <SignInAction />
            <Link
              className="inline-flex h-12 shrink-0 items-center justify-center rounded-[10px] border border-[#1e55c5] bg-white px-6 text-[16px] font-semibold text-[#1e55c5] transition-colors hover:bg-[#f5f8ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e55c5]"
              to="/demo"
            >
              See the demo
            </Link>
          </div>
          {secondary}
      </div>
      <div className="mx-auto w-full max-w-224 min-w-0 min-[1200px]:max-w-none">
        <RawToRead sample={sample} />
      </div>
    </section>
  )
}

/** One step of How it works: a tinted stage for its mascot, then what happens, then the slice of product it involves. */
function HowStep({
  n,
  title,
  text,
  art,
  stage,
  delay,
  children,
}: {
  n: number
  title: string
  text: string
  art: string
  /** The stage's tint, light to lighter. */
  stage: string
  delay: number
  children: React.ReactNode
}) {
  return (
    <li className="relative">
      <Reveal
        className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-[#e3e7f0] bg-white shadow-[0_12px_32px_rgba(20,40,90,0.08)] transition-[translate,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(20,40,90,0.14)] motion-reduce:hover:translate-y-0"
        delay={delay}
      >
        <div className={`relative flex h-44 items-end justify-center overflow-hidden ${stage}`}>
          {/* The step's number, big and faint behind the mascot. */}
          <span
            aria-hidden="true"
            className="absolute -top-4 left-4 text-[120px] leading-none font-bold tracking-[-0.04em] text-white/70 select-none"
          >
            {n}
          </span>
          <img
            alt=""
            className="relative h-36 w-auto translate-y-1 transition-transform duration-300 group-hover:-translate-y-1 motion-reduce:transition-none"
            src={art}
          />
        </div>
        <div className="flex flex-1 flex-col gap-2 p-5">
          <h3 className="m-0 flex items-center gap-2.5 text-[18px] font-semibold text-[#14181f]">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#1e55c5] text-[12px] font-semibold text-white">
              {n}
            </span>
            {title}
          </h3>
          <p className="m-0 text-[14px] leading-5.5 text-[#3f4045]">{text}</p>
          <div
            aria-hidden="true"
            className="mt-auto rounded-[10px] border border-[#e8eaf1] bg-[#fafbfe] p-3.5"
          >
            {children}
          </div>
        </div>
      </Reveal>
      {/* Arrow to the next step, on the gap between cards (wide screens only). */}
      {n < 3 ? (
        <span
          aria-hidden="true"
          className="absolute top-22 -right-5.5 z-10 flex size-9 items-center justify-center rounded-full border border-[#dbe4f6] bg-white text-[#1e55c5] shadow-[0_4px_12px_rgba(20,40,90,0.12)] max-[900px]:hidden"
        >
          <ArrowRight size={16} />
        </span>
      ) : null}
    </li>
  )
}

/** The whole flow in three steps, each shown as the small piece of product it involves. */
function HowItWorks({ sample }: { sample: LandingSample }) {
  // Step 3 shows the sample's topic that's getting worse, with its real sentiment split.
  const worseId = sample.whatChanged.rows.find((row) => row.kind === 'worse')?.id
  const worse = sample.topics.find((topic) => topic.id === worseId) ?? sample.topics[0]!
  const total = worse.negative + worse.neutral + worse.positive
  const share = (n: number) => `${(n / total) * 100}%`
  return (
    <section aria-labelledby="how-title" className="relative overflow-hidden bg-white">
      {/* Soft colour blobs in the step tints, so the section isn't a flat white sheet. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(28rem_20rem_at_12%_30%,#e3ecff,transparent_70%),radial-gradient(28rem_20rem_at_90%_40%,#dcf5e8,transparent_70%)]"
      />
      <div className={`relative ${SECTION} pt-8 max-[560px]:pt-8`}>
        <div className="mx-auto flex max-w-180 flex-col items-center gap-4 text-center">
          <p className="m-0 flex items-center gap-2 text-[14px] font-medium text-[#726f6f]">
            Ask
            <ArrowRight aria-hidden className="text-[#1e55c5]" size={14} />
            Collect
            <ArrowRight aria-hidden className="text-[#1e55c5]" size={14} />
            Drill down
          </p>
          <h2
            className="m-0 text-[56px] leading-[1.02] font-bold tracking-[-0.03em] text-balance max-[560px]:text-[40px]"
            id="how-title"
          >
            How it works
          </h2>
          <p className="m-0 text-[20px] leading-7 font-medium text-[#3f4045] max-[560px]:text-[17px]">
            Three steps from{' '}
            <span className="text-[#14181f] underline decoration-[#ffc94d] decoration-4 underline-offset-4">
              form
            </span>{' '}
            to{' '}
            <span className="text-[#14181f] underline decoration-[#5fd39a] decoration-4 underline-offset-4">
              findings
            </span>
          </p>
        </div>
        <div className="relative">
          {/* Yellow glow under the Collect card, in its stage's tint. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -bottom-28 h-64 bg-[radial-gradient(26rem_14rem_at_50%_60%,#fff1d6,transparent_70%)] max-[900px]:hidden"
          />
        <ol className="relative m-0 mx-auto grid w-full max-w-240 list-none grid-cols-3 gap-8 p-0 max-[900px]:max-w-110 max-[900px]:grid-cols-1">
          <HowStep
            art={askMascot}
            delay={0}
            n={1}
            stage="bg-linear-to-b from-[#d6e4ff] to-[#eef3ff]"
            text="Write your open questions."
            title="Ask"
          >
            <p className="m-0 text-[13px] font-medium text-[#14181f]">What's one thing we should change?</p>
            <div className="mt-2.5 h-8 rounded-[8px] border border-[#d2d8e5] bg-white" />
          </HowStep>
          <HowStep
            art={shareMascot}
            delay={110}
            n={2}
            stage="bg-linear-to-b from-[#ffe6b8] to-[#fff6e3]"
            text="Send one link. Feedback comes in within minutes."
            title="Collect"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2 text-[13px] text-[#1e55c5]">
                <LinkIcon className="shrink-0" size={14} />
                <span className="truncate">opengnp.sit.kmutt.ac.th/f/…</span>
              </span>
              <span className="shrink-0 text-[13px] font-semibold text-[#14181f] tabular-nums">
                {sample.responseCount} <span className="font-normal text-[#726f6f]">responses</span>
              </span>
            </div>
          </HowStep>
          <HowStep
            art={readMascot}
            delay={220}
            n={3}
            stage="bg-linear-to-b from-[#ccf0dc] to-[#ecfaf2]"
            text="AI groups feedback into topics and trends. Drill into any one."
            title="Drill down"
          >
            <div className="flex flex-col gap-2">
              <span className="flex items-center justify-between gap-3 text-[13px] text-[#14181f]">
                <span className="min-w-0 truncate">{worse.label}</span>
                <span className="flex shrink-0 items-center gap-1 text-[12px] font-semibold text-[#e12b0c]">
                  <TrendingUp size={13} />
                  Getting worse
                </span>
              </span>
              <span className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
                <span
                  style={{
                    width: share(worse.negative),
                    backgroundColor: SENTIMENT_COLORS.negative,
                  }}
                />
                <span
                  style={{
                    width: share(worse.neutral),
                    backgroundColor: SENTIMENT_COLORS.neutral,
                  }}
                />
                <span
                  style={{
                    width: share(worse.positive),
                    backgroundColor: SENTIMENT_COLORS.positive,
                  }}
                />
              </span>
            </div>
          </HowStep>
        </ol>
        </div>
        <div className="relative z-10 flex flex-col gap-3">
          <DashboardPicture sample={sample} />
          <p className="m-0 text-center text-[13px] font-medium tracking-[0.04em] text-[#726f6f] lowercase">
            Sample from {sample.responseCount} staff feedback responses
          </p>
        </div>
      </div>
    </section>
  )
}

const NAV_LINK =
  'rounded-[10px] px-3 py-2 text-[14px] font-semibold text-[#1e55c5] hover:bg-[#e8eefc] focus-visible:outline-2 focus-visible:outline-[#1e55c5]'

/** Signed in: the account's avatar, opening Home, Profile and Log out, as in the app's sidebar. */
function AccountMenu({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const name = user.fullName?.trim() || user.email
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Account options"
          className="ml-2 flex cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 transition-shadow hover:ring-4 hover:ring-[#4c71f7]/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e55c5]"
          title={name}
          type="button"
        >
          <UserAvatar avatarUrl={user.avatarUrl ?? null} className="size-8 text-[12px]" email={user.email} name={user.fullName} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-50">
        <div className="px-2 py-1.5">
          <p className="m-0 truncate text-[13px] font-semibold text-[#3f4045]">{name}</p>
          <p className="m-0 truncate text-[12px] text-[#6f6d6a]">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/">
            <Home size={14} />
            Go to home
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/profile">
            <UserRound size={14} />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onLogout}>
          <LogOut size={14} />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function SiteHeader({ page }: { page: 'landing' | 'demo' }) {
  const { status, user, logout } = useAuth()
  const signedIn = status === 'ready'
  return (
    // The landing page's header is as wide as its hero (83rem), so the logo and the last link line up with it.
    <header
      className={cn(
        'relative z-20 mx-auto flex items-center justify-between px-6 py-5 max-[560px]:px-4',
        page === 'landing' ? 'max-w-[83rem]' : 'max-w-300',
      )}
    >
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
        {signedIn && user ? (
          <AccountMenu onLogout={() => void logout()} user={user} />
        ) : (
          <Link className={NAV_LINK} to="/login">
            Sign in
          </Link>
        )}
      </nav>
    </header>
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

// Two-tone: the point in full contrast, the rest a step lighter, so a skim catches the point.
const HERO_TITLE = (
  <>
    {/* Two fixed lines beside the dashboard; stacked on narrower screens they wrap as they need. */}
    <span className="min-[1200px]:block min-[1200px]:whitespace-nowrap">Turn open-ended feedback</span>{' '}
    <span className="min-[1200px]:block min-[1200px]:whitespace-nowrap">into insights you can drill into</span>
  </>
)

// The two ends of the drill-down carry the weight; the connecting words stay quiet.
const HERO_INTRO = (
  <>
    From <span className="font-medium text-[#1e55c5]">overall sentiment</span> down to the{' '}
    <span className="font-medium text-[#1e55c5]">grievance</span> behind it.
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

const ACCENTS = {
  blue: {
    tag: 'bg-[#e3ecff] text-[#1e55c5]',
    num: 'bg-[#1e55c5]',
    mark: 'from-[#cfdfff] to-[#cfdfff]',
    check: 'bg-[#1e55c5]',
  },
  red: {
    tag: 'bg-[#ffe7e0] text-[#c4280b]',
    num: 'bg-[#e0461f]',
    mark: 'from-[#ffd5c8] to-[#ffd5c8]',
    check: 'bg-[#e0461f]',
  },
  pink: {
    tag: 'bg-[#ffe4ec] text-[#c2365f]',
    num: 'bg-[#e0507a]',
    mark: 'from-[#ffd0de] to-[#ffd0de]',
    check: 'bg-[#e0507a]',
  },
} as const

/** A title's key words, marked like a highlighter in the point's colour. */
function Mark({ accent, children }: { accent: keyof typeof ACCENTS; children: React.ReactNode }) {
  return (
    <span
      className={`bg-linear-to-r ${ACCENTS[accent].mark} box-decoration-clone bg-[length:100%_0.42em] bg-bottom bg-no-repeat px-0.5`}
    >
      {children}
    </span>
  )
}

/** One selling point: what the visitor gains, beside the slice of the app that delivers it. */
function SellingPoint({
  n,
  tag,
  icon: Icon,
  accent,
  title,
  points,
  visual,
  flip = false,
  stillVisual = false,
}: {
  n: number
  tag: string
  icon: React.ComponentType<{ size?: number; 'aria-hidden'?: boolean }>
  accent: keyof typeof ACCENTS
  title: React.ReactNode
  /** Two or three short facts, read at a glance. */
  points: React.ReactNode[]
  visual: React.ReactNode
  flip?: boolean
  /** The visual has its own scroll-driven motion, so it doesn't slide in too. */
  stillVisual?: boolean
}) {
  const colors = ACCENTS[accent]
  return (
    <div className="grid grid-cols-2 items-center gap-16 max-[900px]:grid-cols-1 max-[900px]:gap-8">
      <Reveal
        className={`flex flex-col items-start gap-5 ${flip ? 'min-[901px]:order-2' : ''}`}
        from={flip ? 'right' : 'left'}
      >
        <span
          className={`inline-flex items-center gap-2 rounded-full py-1 pr-3.5 pl-1 text-[13px] font-semibold ${colors.tag}`}
        >
          <span
            className={`flex size-6 items-center justify-center rounded-full text-[12px] text-white ${colors.num}`}
          >
            {n}
          </span>
          <Icon aria-hidden size={14} />
          {tag}
        </span>
        <h2 className="m-0 text-[40px] leading-[1.1] font-bold tracking-[-0.025em] text-balance text-[#14181f] max-[560px]:text-[30px]">
          {title}
        </h2>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {points.map((point, i) => (
            <li className="flex items-center gap-3 text-[17px] leading-6 font-medium text-[#3f4045]" key={i}>
              <span
                className={`flex size-5.5 shrink-0 items-center justify-center rounded-full text-white ${colors.check}`}
              >
                <Check aria-hidden size={13} strokeWidth={3} />
              </span>
              {point}
            </li>
          ))}
        </ul>
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
          accent="blue"
          icon={Sparkles}
          n={1}
          points={['AI groups feedback into topics', 'See how people feel about each']}
          stillVisual
          tag="Auto-sort"
          title={
            <>
              Stop reading feedback <Mark accent="blue">one by one</Mark>
            </>
          }
          visual={
            // Mascots behind a card come before it, those in front come after: the card is positioned, so DOM order sets the stacking.
            <div className="spot-card relative max-[900px]:mt-8 [--glow:rgb(30_85_197/0.2)]">
              <img alt="" className="absolute -top-[60px] right-8 w-35" src={penguinMascot} />
              <div className={`${card} relative flex flex-col gap-2.5 p-5`}>
                <div className="flex items-center justify-between gap-3 pb-1">
                  <span className="text-[13px] font-semibold text-[#14181f]">
                    {sample.responseCount} responses in, {rows.length} topics out
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
                        <CornerDownRight aria-hidden size={12} />
                        Filed under {rows.find((row) => row.id === comment.topicId)?.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          }
        />
        <SellingPoint
          accent="red"
          flip
          icon={TrendingUp}
          n={2}
          points={['Compared with last week, automatically', 'Only real changes are called out']}
          tag="Trends"
          title={
            <>
              Know what got <Mark accent="red">worse</Mark> before it becomes a problem
            </>
          }
          visual={
            <div className="spot-card relative max-[900px]:mt-22 [--glow:rgb(196_40_11/0.22)]">
              <img alt="" className="absolute -top-[114px] left-8 w-26" src={monkeyMascot} />
              <div className="relative">
                <WhatChangedCard data={sample.whatChanged} />
              </div>
            </div>
          }
        />
        <SellingPoint
          accent="pink"
          icon={TriangleAlert}
          n={3}
          points={['Possible grievances flagged for review', 'You confirm or dismiss. Try it →']}
          tag="Grievance flags"
          title={
            <>
              Catch serious grievances <Mark accent="pink">early.</Mark> You make the call.
            </>
          }
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
        />
      </section>
    </div>
  )
}

const TRUST = [
  {
    icon: Server,
    title: 'Stays at KMUTT',
    text: 'AI runs on KMUTT servers. Never sent to ChatGPT or Gemini.',
  },
  {
    icon: EyeOff,
    title: 'Names stay private',
    text: "Shared viewers don't see who gave feedback unless you allow it.",
  },
  {
    icon: UserCheck,
    title: 'You make the call',
    text: 'The AI suggests. You confirm or dismiss every flag.',
  },
]

/** The page's finale: why it's safe, then the one action. Dark, so the page ends on a clear peak. */
function Finale() {
  return (
    <section
      aria-labelledby="trust-title"
      className="relative overflow-hidden bg-[#0d1b3e] text-white bg-[radial-gradient(60rem_30rem_at_50%_-10%,rgb(30_85_197/0.55),transparent_70%),radial-gradient(30rem_20rem_at_100%_100%,rgb(224_80_122/0.18),transparent_70%)]"
    >
      {/* Faint grid, fading out toward the bottom. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07] bg-[linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] bg-size-[48px_48px] mask-[linear-gradient(to_bottom,black,transparent_75%)]"
      />
      <div className="relative mx-auto flex max-w-300 flex-col items-center gap-14 px-6 py-28 max-[560px]:gap-10 max-[560px]:px-4 max-[560px]:py-20">
        <div className="flex flex-col items-center gap-4 text-center">
          {/* Same eyebrow as the hero's (bar + text), in a light blue for the dark band. */}
          <p className="m-0 flex items-center gap-2 text-[15px] font-medium text-[#8fb3ff]">
            <span aria-hidden="true" className="h-3.5 w-0.5 rounded-full bg-[#8fb3ff]" />
            Private by design
          </p>
          <h2
            className="m-0 text-[44px] leading-[1.08] font-semibold tracking-[-0.02em] text-balance max-[560px]:text-[32px]"
            id="trust-title"
          >
            Built for sensitive feedback
          </h2>
        </div>
        <ul className="m-0 grid w-full max-w-224 list-none grid-cols-3 gap-5 p-0 max-[900px]:grid-cols-1">
          {TRUST.map(({ icon: Icon, title, text }, i) => (
            <li key={title}>
              <Reveal
                className="flex h-full flex-col gap-3 rounded-[15px] bg-white/6 p-6 transition-colors hover:bg-white/9"
                delay={i * 110}
              >
                {/* Flat brand blue (a step brighter, to read on navy): colour for the band, no gradient or glow. */}
                <span className="flex size-11 items-center justify-center rounded-[12px] bg-[#3b74e8]">
                  <Icon aria-hidden className="text-white" size={22} strokeWidth={2} />
                </span>
                <p className="m-0 text-[18px] font-semibold">{title}</p>
                <p className="m-0 text-[14px] leading-5.5 text-[#b9c8ea]">{text}</p>
              </Reveal>
            </li>
          ))}
        </ul>
        <div className="flex w-full flex-col items-center gap-5 border-t border-white/12 pt-14 text-center max-[560px]:pt-10">
          <p className="m-0 text-[24px] font-semibold tracking-[-0.01em]">Ask your first question today!</p>
          <SignInAction tone="blue" />
          <Link
            className={cn(
              linkClass,
              'inline-flex items-center gap-1.5 text-[14px] font-semibold text-white underline focus-visible:outline-white',
            )}
            to="/demo"
          >
            or see the full demo first
            <ArrowRight aria-hidden size={14} />
          </Link>
        </div>
        <div className="flex w-full flex-col items-center gap-4 border-t border-white/12 pt-14 text-center max-[560px]:pt-10">
          <p className="m-0 text-[20px] font-semibold tracking-[-0.01em]">Like what you see?</p>
          <p className="m-0 max-w-110 text-[14px] leading-5.5 text-[#b9c8ea]">
            Help us to get one step closer to winning the Senior Project Award 2026 by voting for us! 
          </p>
          <a
            className="inline-flex h-10.5 items-center gap-2 rounded-[10px] bg-[#e0507a] px-5 text-[14px] font-semibold text-white shadow-[0_8px_20px_rgb(224_80_122/0.4)] transition-colors hover:bg-[#c93f68] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            href="https://seniorproject.sit.kmutt.ac.th/showproject/CS66-RE67"
            rel="noopener noreferrer"
            target="_blank"
          >
            <Heart aria-hidden size={16} />
            Vote for us
          </a>
        </div>
      </div>
    </section>
  )
}

// A soft blue glow and faint dot grid behind the hero, so the page doesn't open on a flat fill.
const HERO_BG =
  'pointer-events-none absolute inset-x-0 top-0 h-[max(900px,100svh)] bg-[radial-gradient(70rem_36rem_at_50%_-8rem,#d6e4ff,transparent_70%),radial-gradient(#c3d2f0_1.3px,transparent_1px)] bg-size-[auto,22px_22px] mask-[linear-gradient(to_bottom,black_45%,transparent)]'

const PAGE = 'relative min-h-screen bg-[#f5f9ff] text-[#14181f] selection:bg-[#cfe0ff]'

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
      {/* Behind the header and headline; fades out before the dashboard so it sits on calm ground. */}
      <div aria-hidden="true" className={HERO_BG} />
      <SiteHeader page="landing" />
      <main className="relative">
        <div className="relative">
          {/* The hero's tint fades into How it works' white, so there's no hard edge between them. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-linear-to-b from-[#f5f9ff]/0 to-white"
          />
          <Hero intro={HERO_INTRO} sample={sample} title={HERO_TITLE} />
        </div>
        {/* White band before the selling points; only a bottom rule, as the hero fades into it from above. */}
        <div className="border-b border-[#e8eaf1]">
          <HowItWorks sample={sample} />
        </div>
        <SellingPoints sample={sample} />
        <Finale />
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
            onMove={() =>
              void showAlert(demoSaveError().message, {
                title: 'Sign in to move forms',
              })
            }
          />
        ) : (
          <FormDashboardPage />
        )}
      </div>
    </DemoContext.Provider>
  )
}
