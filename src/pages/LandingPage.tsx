import { ArrowRight, MessageSquareText, ShieldCheck, Sparkles, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import type { ViolationReview } from '../api/analytics'
import { FeedbackPointCard } from '../components/dashboard/FeedbackSegmentSection'
import { SentimentBar } from '../components/dashboard/SentimentBar'
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

/** Raw answers on the left settle into ranked topics on the right: the product's mechanism in one picture. */
function RawToRead() {
  return (
    <div className="grid grid-cols-[minmax(0,15rem)_auto_minmax(0,1fr)] items-center gap-4 max-[1000px]:grid-cols-1">
      <ul aria-label="Raw feedback" className="m-0 flex list-none flex-col gap-2.5 p-0 max-[1000px]:hidden">
        {RAW_COMMENTS.map((comment, i) => (
          <li
            className="flex items-start gap-2 rounded-[10px] border border-[#e8eaf1] bg-white px-3 py-2.5 text-[13px] leading-4.75 text-[#3f4045] shadow-[0_2px_8px_rgba(15,23,42,0.05)] animate-in fade-in slide-in-from-left-4 fill-mode-both duration-700 ease-out motion-reduce:animate-none"
            key={comment}
            style={{ animationDelay: `${i * 90}ms`, rotate: `${[-1.2, 0.8, -0.4, 1, -0.8][i]}deg` }}
          >
            <MessageSquareText className="mt-0.5 shrink-0 text-[#1e55c5]" size={14} />
            <span>“{comment}”</span>
          </li>
        ))}
      </ul>

      <ArrowRight
        aria-hidden="true"
        className="text-[#8fc9ff] animate-in fade-in fill-mode-both delay-500 duration-500 motion-reduce:animate-none max-[1000px]:hidden"
        size={28}
      />

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
          {LANDING_TOPICS.map((topic) => (
            <li
              className={`flex flex-col gap-1.5 px-5 py-2.5 ${
                topic.hasViolation ? 'bg-[#fff7f8]' : ''
              }`}
              key={topic.id}
            >
              <span className="flex min-w-0 flex-1 items-center gap-2 text-[14px] text-[#14181f]">
                <span className="truncate">{topic.label}</span>
                {topic.hasViolation ? (
                  <TriangleAlert aria-label="Contains possible violations" className="shrink-0 text-[#e0507a]" size={15} />
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
          ))}
        </ul>
      </section>
    </div>
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

        <section className="border-y border-[#e8eaf1] bg-white">
          <div className="mx-auto flex max-w-300 flex-col gap-12 px-6 py-24 max-[560px]:px-4 max-[560px]:py-16">
            <div className="flex max-w-160 flex-col gap-4">
              <h2 className="m-0 text-[32px] leading-[1.15] font-semibold tracking-[-0.01em] text-balance">
                See what changed, not just what was said.
              </h2>
              <p className="m-0 text-[16px] leading-6.5 text-[#3f4045]">
                Follow each topic week by week, with the mood of every week underneath. Then compare this period
                with the last: topics only show up when complaints clearly rise or fall, or when something new
                appears, so a busy month doesn't bury the one thing getting worse.
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
              AI can be wrong, so nothing stays a black box. Open any topic to read its summary and the exact
              comments behind it. When something is flagged as a possible violation, you decide whether it stands.
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
        <span>{brand.name} · a capstone project at KMUTT</span>
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
