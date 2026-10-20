import { ArrowLeft, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { brand } from '../data/dashboard'

const UPDATED = 'October 2026'

/**
 * Where "Back" goes. A respondent arrives from a form (`?from=/f/…`) and has no account,
 * so they go back to that form, not to sign-in. Anyone else goes to "/", which signs in
 * first if needed, otherwise lands on Home. Only our own form paths: never an outside URL.
 */
function useBackTarget() {
  const from = useSearchParams()[0].get('from')
  return from && /^\/f\/[\w-]+$/.test(from)
    ? { to: from, label: 'Back to the form', query: `?from=${encodeURIComponent(from)}` }
    : { to: '/', label: `Back to ${brand.name}`, query: '' }
}

/** Terms / Privacy: public (no sign-in), opened in a new tab from login and the form page. */
function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  const back = useBackTarget()
  return (
    <div className="min-h-screen bg-[#f5f9ff] px-4 py-10 font-['Inter_Variable'] text-[#3f4045]">
      <article className="mx-auto w-full max-w-170 rounded-[10px] border border-[#e8eaf1] bg-white p-8 max-[560px]:p-5">
        <div className="flex items-center justify-between gap-4">
          <Link aria-label={back.label} to={back.to}>
            <img alt={brand.name} className="h-9 w-17.25 object-cover object-center" src={brand.logo} />
          </Link>
          <Link className="flex items-center gap-1.5 text-[13px] font-medium text-[#1e55c5] hover:underline" to={back.to}>
            <ArrowLeft size={15} />
            {back.label}
          </Link>
        </div>
        <h1 className="m-0 mt-5 text-[24px] font-semibold text-[#14181f]">{title}</h1>
        <p className="m-0 mt-1 text-[13px] text-[#8b8e98]">Last updated {UPDATED}</p>
        <div className="mt-6 flex flex-col gap-5 text-[14px] leading-6 [&_h2]:m-0 [&_h2]:mb-1.5 [&_h2]:text-[16px] [&_h2]:font-semibold [&_h2]:text-[#14181f] [&_li]:mt-1 [&_p]:m-0 [&_ul]:m-0 [&_ul]:pl-5">
          {children}
        </div>
        <footer className="mt-8 flex gap-4 border-t border-[#e8eaf1] pt-4 text-[13px]">
          {/* Keeps `from`, so switching pages doesn't lose the way back. */}
          <Link className="text-[#1e55c5] hover:underline" to={`/terms${back.query}`}>
            Terms of Use
          </Link>
          <Link className="text-[#1e55c5] hover:underline" to={`/privacy${back.query}`}>
            Privacy Notice
          </Link>
        </footer>
      </article>
    </div>
  )
}

export function TermsPage() {
  return (
    <LegalPage title="Terms of Use">
      <section>
        <h2>About {brand.name}</h2>
        <p>
          {brand.name} is a capstone project at KMUTT for collecting feedback and analysing it with AI. It is provided
          as is, for teaching, research and use within the university, and may change or be unavailable at times.
        </p>
      </section>
      <section>
        <h2>Your account</h2>
        <p>
          You sign in with your Microsoft account. Keep it secure, and don't let others use {brand.name} as you.
        </p>
      </section>
      <section>
        <h2>Your forms and the responses you collect</h2>
        <ul>
          <li>You are responsible for what your forms ask, and for having a good reason to collect it.</li>
          <li>Don't collect data you aren't allowed to, such as passwords or sensitive personal data without a lawful basis.</li>
          <li>Tell respondents what their answers are for, and only share results with people who need them.</li>
          <li>AI analysis (topics, sentiment, violation flags) can be wrong. Check it before acting on it.</li>
        </ul>
      </section>
      <section>
        <h2>Acceptable use</h2>
        <p>
          Don't use {brand.name} to harass anyone, to break the law or university rules, or to disrupt the service.
          Accounts or forms that do may be removed.
        </p>
      </section>
    </LegalPage>
  )
}

export function PrivacyPage() {
  return (
    <LegalPage title="Privacy Notice">
      {/* The point people most want to know first. */}
      <section className="flex gap-3 rounded-[10px] border border-[#cfe0ff] bg-[#edf2fd] p-4">
        <ShieldCheck className="mt-0.5 shrink-0 text-[#1e55c5]" size={20} />
        <div>
          <h2>Your feedback never leaves our servers</h2>
          <p>
            {brand.name}'s AI runs locally, on our own servers at KMUTT. Responses are analysed there and are never
            sent to outside AI services such as ChatGPT or Gemini, so they can't be used to train anyone else's
            models.
          </p>
        </div>
      </section>
      <section>
        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Your account:</strong> your name, email address and organization, from Microsoft when you sign in.
          </li>
          <li>
            <strong>Forms you create:</strong> their questions and settings, and who you share results with.
          </li>
          <li>
            <strong>Responses:</strong> the answers people give. A respondent's name is kept only when the form asks
            for it; otherwise responses are stored under a random code.
          </li>
          <li>
            <strong>Usage:</strong> when you last opened each form, to sort your recent forms.
          </li>
        </ul>
      </section>
      <section>
        <h2>How it's used</h2>
        <ul>
          <li>To show each form's owner its results, and the people the owner shares them with.</li>
          <li>
            To analyse written answers with AI: split into points, grouped into topics, labelled by sentiment, and
            checked for possible violations of law, ethics or morals.
          </li>
          <li>To sign you in and keep the service working.</li>
        </ul>
        <p className="mt-2">We don't sell your data or use it for advertising.</p>
      </section>
      <section>
        <h2>Where it's kept</h2>
        <p>
          Everything is stored and processed on {brand.name}'s own servers at KMUTT: the database, uploaded images,
          and the AI models (the language model and the text-embedding model both run on our hardware). Microsoft
          only handles signing in and receives none of your forms or responses.
        </p>
      </section>
      <section>
        <h2>How long</h2>
        <p>
          Responses and their analysis stay until the form's owner deletes the form. Your account and your forms
          stay until your account is deleted.
        </p>
      </section>
      <section>
        <h2>Cookies and storage</h2>
        <p>
          One cookie keeps you signed in. Your browser also remembers small preferences, such as whether you've seen
          a tour. No tracking or advertising cookies.
        </p>
      </section>
      <section>
        <h2>Your rights</h2>
        <p>
          Under Thailand's Personal Data Protection Act you can ask to see, correct or delete your personal data. For
          a response you gave, ask the form's owner. For anything else, contact the {brand.name} project team.
        </p>
      </section>
    </LegalPage>
  )
}
