import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Building2, CalendarDays, FileText, Mail, MessageSquareText, Trash2, Users } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { meQuery, sharedFormsQuery } from '../api/queries'
import { deleteMyAccount, getDeletionSummary } from '../api/users'
import { PageContainer } from '../components/layout/PageContainer'
import { UserAvatar } from '../components/UserAvatar'
import { clearAlerts, showAlert, showConfirm } from '../lib/alertDialog'
import { ApiError } from '../lib/api'
import { useAuth } from '../lib/auth'

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

const SECTION_HEADING = 'm-0 mb-3 text-[13px] font-semibold tracking-[0.13px] text-[#5f6368]'

/** One number about the account, linking to where it lives. */
function Stat({
  icon: Icon,
  label,
  value,
  to,
}: {
  icon: typeof FileText
  label: string
  value: number | undefined
  to?: string
}) {
  const body = (
    <>
      <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#726f6f]">
        <Icon aria-hidden className="shrink-0" size={14} />
        {label}
      </span>
      <span className="flex items-end justify-between gap-2">
        <span className="text-[24px] leading-8 font-bold text-[#14181f] tabular-nums">
          {value === undefined ? <span className="inline-block h-6 w-10 rounded-[6px] bg-[#eef0f4] align-middle" /> : value}
        </span>
        {to ? <ArrowRight aria-hidden className="mb-1.5 text-[#726f6f] transition-colors group-hover:text-[#1e55c5]" size={16} /> : null}
      </span>
    </>
  )
  const box = 'flex flex-col gap-2 rounded-[10px] border border-[#e9eaed] bg-white px-4 py-3.5'
  return to ? (
    <Link
      className={`${box} group transition-colors hover:border-[#d2d8e5] hover:bg-[#fbfcfe] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e55c5]`}
      to={to}
    >
      {body}
    </Link>
  ) : (
    <div className={box}>{body}</div>
  )
}

export function ProfilePage() {
  const { user, logout } = useAuth()
  // busy: from the first click until it's settled; deleting: only once confirmed.
  const [busy, setBusy] = useState(false)
  const [deleting, setDeleting] = useState(false)
  // Fresh from /users/me: the session copy (from sign-in) lacks the organization name and join date.
  const me = useQuery(meQuery())
  // The same counts the delete confirmation states, shown up front.
  const summary = useQuery({ queryKey: ['me', 'deletion-summary'], queryFn: getDeletionSummary })
  const shared = useQuery(sharedFormsQuery())
  if (!user) return null
  const profile = me.data ?? user
  const organizationName = me.data?.organizationName ?? null

  async function handleDelete() {
    if (!user || busy) return
    // Busy from the first click: the summary takes a moment, and a second click would queue a second confirm.
    setBusy(true)
    try {
      const { forms, responses } = await getDeletionSummary()
      const confirmed = await showConfirm({
        title: 'Delete your account?',
        message:
          `This permanently deletes your account, ${plural(forms, 'form')} and the ${plural(responses, 'response')} they collected. ` +
          "Responses you sent to other people's forms stay, without your name. This can't be undone.",
        confirmLabel: 'Delete account',
        destructive: true,
        typeToConfirm: user.email,
      })
      if (!confirmed) return
      setDeleting(true)
      await deleteMyAccount()
      // Nothing may outlive the account on screen (the sign-in page comes next).
      clearAlerts()
      await logout()
    } catch (error) {
      void showAlert(error instanceof ApiError ? error.message : 'Could not delete your account. Please try again.')
    } finally {
      setBusy(false)
      setDeleting(false)
    }
  }

  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    : null
  const detail = 'flex min-w-0 items-center gap-1.5 text-[13px] text-[#3f4045]'

  return (
    <div className="min-h-[calc(100vh-50px)] min-[900px]:min-h-screen">
      <PageContainer>
        {/* Same title row as My forms / Shared with me. */}
        <div className="pt-8 pb-1">
          <h1 className="m-0 px-1.5 py-1 text-[22px] font-semibold text-[#3c4043]">Profile</h1>
        </div>
        <p className="m-0 px-1.5 text-[13px] text-[#726f6f]">Your account and what you can do with it.</p>

        <div className="mt-4 flex max-w-200 flex-col gap-8">
          <section aria-labelledby="profile-account-heading">
            <h2 className={SECTION_HEADING} id="profile-account-heading">
              Account
            </h2>
            <div className="flex items-center gap-5 rounded-[10px] border border-[#e9eaed] bg-white px-5 py-5 max-[560px]:flex-col max-[560px]:items-start max-[560px]:gap-4">
              <UserAvatar
                avatarUrl={user.avatarUrl}
                className="size-18 shrink-0 text-[24px]"
                email={user.email}
                name={user.fullName}
              />
              <div className="flex min-w-0 flex-col gap-2">
                <p className="m-0 truncate text-[20px] font-semibold text-[#14181f]">{user.fullName ?? user.email}</p>
                <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                  <span className={detail}>
                    <Mail aria-hidden className="shrink-0 text-[#726f6f]" size={14} />
                    <span className="truncate">{user.email}</span>
                  </span>
                  {organizationName ? (
                    <span className={detail}>
                      <Building2 aria-hidden className="shrink-0 text-[#726f6f]" size={14} />
                      <span className="truncate">{organizationName}</span>
                    </span>
                  ) : null}
                  {memberSince ? (
                    <span className={detail}>
                      <CalendarDays aria-hidden className="shrink-0 text-[#726f6f]" size={14} />
                      Member since {memberSince}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section aria-labelledby="profile-workspace-heading">
            <h2 className={SECTION_HEADING} id="profile-workspace-heading">
              Your workspace
            </h2>
            <div className="grid grid-cols-3 gap-4 max-[700px]:grid-cols-1">
              <Stat icon={FileText} label="Forms you own" to="/my-forms" value={summary.data?.forms} />
              <Stat icon={MessageSquareText} label="Responses collected" value={summary.data?.responses} />
              <Stat icon={Users} label="Shared with you" to="/shared" value={shared.data?.length} />
            </div>
          </section>

          <section aria-labelledby="profile-delete-heading">
            <h2 className={SECTION_HEADING} id="profile-delete-heading">
              Delete account
            </h2>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-[10px] border border-[#f3d0dc] bg-[#fffafb] px-5 py-4">
              <p className="m-0 min-w-0 max-w-110 text-[13px] leading-5 text-[#3f4045]">
                Permanently deletes your account, your forms and every response they collected. This can&apos;t be
                undone.
              </p>
              <button
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-[#e0507a] bg-white px-3 py-1.5 text-[13px] font-medium text-[#c2365f] transition-colors hover:bg-[#fcf3f6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e55c5] disabled:cursor-default disabled:opacity-60"
                disabled={busy}
                onClick={() => void handleDelete()}
                type="button"
              >
                <Trash2 size={14} />
                {deleting ? 'Deleting…' : 'Delete account'}
              </button>
            </div>
          </section>
        </div>
      </PageContainer>
    </div>
  )
}
