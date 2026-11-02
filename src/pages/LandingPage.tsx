import {
  ArrowRight,
  Link as LinkIcon,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import type { ViolationReview } from '../api/analytics'
import { FeedbackPointCard } from '../components/dashboard/FeedbackSegmentSection'
import { SentimentBar } from '../components/dashboard/SentimentBar'
import { SENTIMENT_COLORS } from '../components/dashboard/sentimentColors'
import { TopicTrendsCard } from '../components/dashboard/TopicTrendsCard'
import { WhatChangedCard } from '../components/dashboard/TrendView'
import { MicrosoftSignInButton } from '../components/MicrosoftSignInButton'
import { Button } from '../components/ui/button'
import { brand } from '../data/dashboard'
import type { FeedbackPoint } from '../data/dashboardAnalytics'
import {
  DRILL_TOPIC,
  FLAGGED_POINT,
  FLAGGED_TOPIC,
  LANDING_TOPICS,
  LANDING_TREND,
  LANDING_WHAT_CHANGED,
  RAW_COMMENTS,
  SAMPLE_RESPONSE_COUNT,
} from '../data/landingSample'
import { useAuth } from '../lib/auth'
import { msalInstance } from '../lib/msal'

// Largest sample topic (42 points) rounded up to a step of 10, as the dashboard's axis does.
const AXIS_MAX = 50

const linkClass =
  'rounded-[4px] text-[#1e55c5] underline-offset-3 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e55c5]'

function SampleTag() {
  return (
    <span className="rounded-full bg-[#fff4d9] px-2 py-0.5 text-[11px] font-semibold text-[#7a5a00]">Sample data</span>
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
          tone === 'blue' ? 'bg-white text-[#1e55c5] hover:bg-[#e8eefc]' : ''
        }`}
      >
        <Link to="/">
          Go to Home
          <ArrowRight size={16} />
        </Link>
      </Button>
    )
  }
  return (
    <div className="flex w-full max-w-80 flex-col gap-3">
      {msalInstance ? (
        <MicrosoftSignInButton onBusyChange={() => {}} onError={setError} />
      ) : (
        <Button
          asChild
          className={`h-10.5 w-full justify-center rounded-[10px] text-[14px] font-semibold ${
            tone === 'blue' ? 'bg-white text-[#1e55c5] hover:bg-[#e8eefc]' : ''
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
        <Link className={tone === 'blue' ? `${linkClass} text-white underline` : linkClass} to="/terms">
          Terms of Use
        </Link>{' '}
        and acknowledge the{' '}
        <Link className={tone === 'blue' ? `${linkClass} text-white underline` : linkClass} to="/privacy">
          Privacy Notice
        </Link>
        .
      </p>
    </div>
  )
}

/** Raw answers on the left, ranked topics on the right; the highlight shows where each answer was filed. */
function RawToRead() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const activeTopic = RAW_COMMENTS[active]!.topicId

  // Steps through the comments by itself until someone points at one.
  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => setActive((i) => (i + 1) % RAW_COMMENTS.length), 2600)
    return () => window.clearInterval(timer)
  }, [paused])

  const pick = (i: number) => {
    setActive(i)
    setPaused(true)
  }

  return (
    <div className="grid grid-cols-[minmax(0,15rem)_auto_minmax(0,1fr)] items-center gap-4 max-[1000px]:grid-cols-1">
      <ul
        aria-label="Raw feedback: point at one to see its topic"
        className="m-0 flex list-none flex-col gap-2.5 p-0 max-[1000px]:hidden"
        onMouseLeave={() => setPaused(false)}
      >
        {RAW_COMMENTS.map((comment, i) => (
          <li
            className="animate-in fade-in slide-in-from-left-4 fill-mode-both duration-700 ease-out motion-reduce:animate-none"
            key={comment.text}
            style={{ animationDelay: `${i * 90}ms`, rotate: i === active ? '0deg' : `${[-1.2, 0.8, -0.4, 1, -0.8][i]}deg` }}
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
        <span className="animate-in fade-in duration-500 motion-reduce:animate-none">“{RAW_COMMENTS[active]!.text}”</span>
      </p>

      <section
        aria-label="Topics found in the sample feedback"
        className="flex flex-col rounded-[15px] border border-[#e9eaed] bg-white pt-5 pb-3 shadow-[0_16px_40px_rgba(30,85,197,0.10)] animate-in fade-in slide-in-from-right-4 fill-mode-both delay-500 duration-700 ease-out motion-reduce:animate-none"
      >
        <div className="flex items-center justify-between gap-3 px-5 pb-3">
          <h3 className="m-0 flex items-center gap-2 text-[14px] font-semibold text-black">
            <Sparkles className="text-[#1e55c5]" fill="currentColor" size={15} />
            Topics
            <span className="font-medium text-[#726f6f]">{SAMPLE_RESPONSE_COUNT} responses</span>
          </h3>
          <SampleTag />
        </div>
        <ul className="m-0 flex list-none flex-col p-0">
          {LANDING_TOPICS.map((topic) => {
            const isActive = topic.id === activeTopic
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
                  <span className="w-9 text-right text-[14px] text-[#14181f] tabular-nums">{topic.percentOfTotal}%</span>
                </span>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}

/** The whole flow in three steps, each shown as the small piece of product it involves. */
function HowItWorks() {
  const step = 'flex flex-col gap-3'
  const label = 'm-0 flex items-center gap-2.5 text-[16px] font-semibold text-[#14181f]'
  const num =
    'flex size-6 shrink-0 items-center justify-center rounded-full bg-[#1e55c5] text-[12px] font-semibold text-white'
  const text = 'm-0 text-[14px] leading-5.5 text-[#3f4045]'
  const mock = 'rounded-[10px] border border-[#e8eaf1] bg-white p-3.5 shadow-[0_2px_8px_rgba(15,23,42,0.05)]'
  return (
    <section aria-labelledby="how-title" className="mx-auto flex max-w-300 flex-col gap-8 px-6 pb-24 max-[560px]:px-4 max-[560px]:pb-16">
      <h2 className="m-0 text-[24px] leading-[1.2] font-semibold tracking-[-0.01em]" id="how-title">
        How it works
      </h2>
      <ol className="m-0 grid list-none grid-cols-3 gap-8 p-0 max-[900px]:grid-cols-1">
        <li className={step}>
          <h3 className={label}>
            <span className={num}>1</span>
            Ask
          </h3>
          <p className={text}>Build a form with open questions, choices and optional details like department.</p>
          <div className={mock} aria-hidden="true">
            <p className="m-0 text-[13px] font-medium text-[#14181f]">What's one thing we should change?</p>
            <div className="mt-2.5 h-8 rounded-[8px] border border-[#d2d8e5] bg-[#fafbfe]" />
          </div>
        </li>
        <li className={step}>
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
              {SAMPLE_RESPONSE_COUNT} <span className="font-normal text-[#726f6f]">responses</span>
            </span>
          </div>
        </li>
        <li className={step}>
          <h3 className={label}>
            <span className={num}>3</span>
            Read
          </h3>
          <p className={text}>AI groups every answer into topics and shows how people feel and what changed.</p>
          <div className={`${mock} flex flex-col gap-2`} aria-hidden="true">
            <span className="flex items-center justify-between text-[13px] text-[#14181f]">
              Shift swaps take too long
              <span className="flex items-center gap-1 text-[12px] font-semibold text-[#e12b0c]">
                <TrendingUp size={13} />
                Getting worse
              </span>
            </span>
            <span className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
              <span style={{ width: '74%', backgroundColor: SENTIMENT_COLORS.negative }} />
              <span style={{ width: '19%', backgroundColor: SENTIMENT_COLORS.neutral }} />
              <span style={{ width: '7%', backgroundColor: SENTIMENT_COLORS.positive }} />
            </span>
          </div>
        </li>
      </ol>
    </section>
  )
}

const PANEL = 'flex flex-col gap-4 rounded-[15px] border border-[#e9eaed] bg-white p-6 max-[560px]:p-4'

function DrillIn() {
  return (
    <section aria-label={`Feedback behind ${DRILL_TOPIC.label}`} className={PANEL}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="m-0 text-[16px] font-semibold text-black">{DRILL_TOPIC.label}</h3>
        <SampleTag />
      </div>
      <p className="m-0 flex gap-2.5 rounded-[10px] bg-[#edf2fd] p-3.5 text-[13px] leading-5 text-[#1f3d7a]">
        <Sparkles className="mt-0.5 shrink-0 text-[#1e55c5]" fill="currentColor" size={15} />
        {DRILL_TOPIC.summary}
      </p>
      <div className="flex flex-col gap-2.5">
        {DRILL_TOPIC.points.map((point) => (
          <FeedbackPointCard key={point.id} point={point} query="" showName={false} />
        ))}
      </div>
    </section>
  )
}

/** The dashboard's own review controls on a flagged point, answered locally instead of saved. */
function FlagReview() {
  const [point, setPoint] = useState<FeedbackPoint>(FLAGGED_POINT)
  const review = async (status: ViolationReview) =>
    setPoint(
      status === 'confirmed'
        ? { ...FLAGGED_POINT, violationStatus: 'confirmed', reviewedBy: 'you' }
        : status === 'dismissed'
          ? { ...FLAGGED_POINT, violation: false, dismissed: true, reviewedBy: 'you' }
          : FLAGGED_POINT,
    )
  return (
    <section aria-label="Review a flagged comment" className={PANEL}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="m-0 flex items-center gap-2 text-[16px] font-semibold text-black">
          {FLAGGED_TOPIC}
          {point.violation ? (
            <TriangleAlert aria-label="Contains possible violations" className="shrink-0 text-[#e0507a]" size={16} />
          ) : null}
        </h3>
        <SampleTag />
      </div>
      <p className="m-0 text-[13px] leading-5 text-[#726f6f]">
        Try it: confirm the flag, or mark it not a violation to drop it from every count.
      </p>
      <FeedbackPointCard onReview={review} point={point} query="" showName={false} />
    </section>
  )
}

/** The Trend tab's chart and What changed, on sample data; pinning a topic works as in the dashboard. */
function TrendDemo() {
  const [pinned, setPinned] = useState<string | null>('shift')
  return (
    <div className="flex flex-col gap-4.5">
      <TopicTrendsCard
        action={<SampleTag />}
        data={LANDING_TREND.volumeSeries}
        onPinnedTopicChange={setPinned}
        pinnedTopic={pinned}
        sentimentByTopic={LANDING_TREND.topicSentimentSeries}
        sentimentSeries={LANDING_TREND.sentimentSeries}
        series={LANDING_TREND.topicVolumeSeries}
        spikes={LANDING_TREND.timelineEvents}
        summaries={LANDING_TREND.topicSummaries}
      />
      <WhatChangedCard data={LANDING_WHAT_CHANGED} />
    </div>
  )
}

/** "/" for signed-out visitors, and /about for anyone: what the product does, shown with sample data, and the sign-in. */
export function LandingPage() {
  const signedIn = useAuth().status === 'ready'
  return (
    <div className="min-h-screen bg-[#f5f9ff] text-[#14181f] selection:bg-[#cfe0ff]">
      <header className="mx-auto flex max-w-300 items-center justify-between px-6 py-5 max-[560px]:px-4">
        <img alt={brand.name} className="h-9 w-17.25 object-cover object-center" src={brand.logo} />
        <Link
          className="rounded-[10px] px-3 py-2 text-[14px] font-semibold text-[#1e55c5] hover:bg-[#e8eefc] focus-visible:outline-2 focus-visible:outline-[#1e55c5]"
          to={signedIn ? '/' : '/login'}
        >
          {signedIn ? 'Go to Home' : 'Sign in'}
        </Link>
      </header>

      <main>
        <section className="mx-auto grid max-w-300 grid-cols-[minmax(0,26rem)_minmax(0,1fr)] items-center gap-14 px-6 pt-10 pb-24 max-[1200px]:grid-cols-1 max-[1200px]:gap-10 max-[560px]:px-4 max-[560px]:pt-4 max-[560px]:pb-16">
          <div className="flex flex-col items-start gap-6">
            <h1 className="m-0 text-[52px] leading-[1.05] font-semibold tracking-[-0.02em] text-balance max-[560px]:text-[38px]">
              Know what your people are really telling you.
            </h1>
            <p className="m-0 max-w-136 text-[17px] leading-7 text-[#3f4045]">
              Send one form. {brand.name} reads every open answer and sorts it into topics,
              sentiment and what changed since last time, so you know where to act first.
            </p>
            <SignInAction />
          </div>
          <RawToRead />
        </section>

        <HowItWorks />

        <section className="border-y border-[#e8eaf1] bg-white">
          <div className="mx-auto flex max-w-300 flex-col gap-12 px-6 py-24 max-[560px]:px-4 max-[560px]:py-16">
            <div className="flex max-w-160 flex-col gap-4">
              <h2 className="m-0 text-[32px] leading-[1.15] font-semibold tracking-[-0.01em] text-balance">
                See what changed, not just what was said.
              </h2>
              <p className="m-0 text-[16px] leading-6.5 text-[#3f4045]">
                Each line is a topic over time, and the strip below shows how people felt that week. Under it,
                What changed lists only the topics that clearly got worse, got better, or are new.
              </p>
            </div>
            <TrendDemo />
          </div>
        </section>

        <section className="mx-auto flex max-w-300 flex-col gap-12 px-6 py-24 max-[560px]:px-4 max-[560px]:py-16">
          <div className="flex max-w-160 flex-col gap-4">
            <h2 className="m-0 text-[32px] leading-[1.15] font-semibold tracking-[-0.01em] text-balance">
              Every number opens to the words behind it.
            </h2>
            <p className="m-0 text-[16px] leading-6.5 text-[#3f4045]">
              Open any topic to read the AI's summary and the exact comments behind it. AI can be wrong, so when
              it flags a comment as a possible violation, you decide whether it stands.
            </p>
          </div>
          <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-start gap-6 max-[900px]:grid-cols-1">
            <DrillIn />
            <FlagReview />
          </div>
        </section>

        <section className="bg-[#1e55c5] text-white">
          <div className="mx-auto grid max-w-300 grid-cols-[minmax(0,1fr)_auto] items-end gap-12 px-6 py-20 max-[900px]:grid-cols-1 max-[900px]:gap-8 max-[560px]:px-4 max-[560px]:py-16">
            <div className="flex flex-col gap-5">
              <h2 className="m-0 max-w-xl text-[36px] leading-[1.12] font-semibold tracking-[-0.01em] text-balance max-[560px]:text-[30px]">
                Ask your first question today.
              </h2>
              <p className="m-0 flex max-w-xl items-start gap-2.5 text-[16px] leading-6.5 text-[#dbe6ff]">
                <ShieldCheck className="mt-1 shrink-0 text-white" size={18} />
                {brand.name}'s AI runs on KMUTT's own servers. Responses are never sent to outside AI services such
                as ChatGPT or Gemini.
              </p>
            </div>
            <SignInAction tone="blue" />
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-300 flex-wrap items-center justify-between gap-3 px-6 py-8 text-[12px] text-[#726f6f] max-[560px]:px-4">
        <span className="flex flex-wrap gap-x-4 gap-y-1">
          <span>© 2026 {brand.name}</span>
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
    </div>
  )
}
