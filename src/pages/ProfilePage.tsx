import { useQuery } from '@tanstack/react-query'
import { Building2, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { meQuery } from '../api/queries'
import { deleteMyAccount, getDeletionSummary } from '../api/users'
import { PageContainer } from '../components/layout/PageContainer'
import { UserAvatar } from '../components/UserAvatar'
import { showAlert, showConfirm } from '../lib/alertDialog'
import { ApiError } from '../lib/api'
import { useAuth } from '../lib/auth'

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

export function ProfilePage() {
  const { user, logout } = useAuth()
  const [deleting, setDeleting] = useState(false)
  // Fresh from /users/me: the session copy (from sign-in) lacks the organization name and join date.
  const me = useQuery(meQuery())
  if (!user) return null
  const profile = me.data ?? user
  const organizationName = me.data?.organizationName ?? null

  async function handleDelete() {
    if (!user) return
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
      await logout()
    } catch (error) {
      void showAlert(error instanceof ApiError ? error.message : 'Could not delete your account. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="min-h-[calc(100vh-50px)] min-[900px]:min-h-screen">
      <PageContainer>
        {/* Same title row as My forms / Shared with me. */}
        <div className="pt-8 pb-1">
          <h1 className="m-0 px-1.5 py-1 text-[22px] font-semibold text-[#3c4043]">Profile</h1>
        </div>
        <p className="m-0 px-1.5 text-[13px] text-[#8b8e98]">Your account and what you can do with it.</p>

        <div className="mt-4 flex max-w-170 flex-col gap-8">
          <section aria-labelledby="profile-account-heading">
            <h2 className="m-0 mb-3 text-[13px] font-semibold tracking-[0.13px] text-[#5f6368]" id="profile-account-heading">
              Account
            </h2>
            <div className="flex items-center gap-4 rounded-[10px] border border-[#e9eaed] bg-white px-4 py-3.5">
              <UserAvatar
                avatarUrl={user.avatarUrl}
                className="size-12 text-[18px]"
                email={user.email}
                name={user.fullName}
              />
              <div className="min-w-0">
                <p className="m-0 truncate text-[14px] font-medium text-[#3c4043]">{user.fullName ?? user.email}</p>
                <p className="m-0 truncate text-[13px] text-[#8b8e98]">{user.email}</p>
                {memberSince ? <p className="m-0 mt-0.5 text-[12px] text-[#8b8e98]">Member since {memberSince}</p> : null}
                {organizationName ? (
                  <p className="m-0 mt-1.5 flex items-center gap-1.5 text-[13px] text-[#5f6368]">
                    <Building2 className="shrink-0" size={14} />
                    <span className="truncate">{organizationName}</span>
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <section aria-labelledby="profile-delete-heading">
            <h2 className="m-0 mb-3 text-[13px] font-semibold tracking-[0.13px] text-[#5f6368]" id="profile-delete-heading">
              Delete account
            </h2>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-[10px] border border-[#e9eaed] bg-white px-4 py-3.5">
              <p className="m-0 min-w-0 max-w-110 text-[13px] leading-5 text-[#5f6368]">
                Permanently deletes your account, your forms and every response they collected. This can&apos;t be
                undone.
              </p>
              <button
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-[#e0507a] bg-white px-3 py-1.5 text-[13px] font-medium text-[#e0507a] transition-colors hover:bg-[#fcf3f6] disabled:cursor-default disabled:opacity-60"
                disabled={deleting}
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
