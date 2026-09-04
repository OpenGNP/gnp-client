import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { deleteForm, listForms, type ApiForm } from '../api/forms'
import { HeroGraphic } from '../components/dashboard/HeroGraphic'
import { FormCard } from '../components/forms/FormCard'
import { PageContainer } from '../components/layout/PageContainer'
import { recentForms } from '../data/dashboard'
import { ApiError } from '../lib/api'
import { useAuth } from '../lib/auth'
import { formatRelativeTime } from '../lib/formatRelativeTime'

// The API has no cover image yet — reuse the bundled thumbnails, keyed by form id.
const PLACEHOLDER_IMAGES = recentForms.map((form) => form.image)
const placeholderImage = (id: number) =>
  PLACEHOLDER_IMAGES[((id % PLACEHOLDER_IMAGES.length) + PLACEHOLDER_IMAGES.length) % PLACEHOLDER_IMAGES.length]

function firstName(user: { fullName: string | null; email: string } | null): string {
  const source = user?.fullName?.trim() || user?.email || ''
  const [first] = source.split(/[\s@]+/)
  return first || 'there'
}

export function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [forms, setForms] = useState<ApiForm[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    listForms()
      .then((data) => {
        if (cancelled) return
        setForms(data)
        setStatus('ready')
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setErrorMessage(
          error instanceof ApiError ? error.message : 'Something went wrong loading your forms.',
        )
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [reloadKey])

  function retryLoad() {
    setStatus('loading')
    setErrorMessage('')
    setReloadKey((key) => key + 1)
  }

  async function handleDeleteForm(id: number) {
    const target = forms.find((form) => form.id === id)
    if (!window.confirm(`Delete "${target?.formTitle ?? 'this form'}"? This can't be undone.`)) {
      return
    }

    const snapshot = forms
    setForms((current) => current.filter((form) => form.id !== id))
    try {
      await deleteForm(id)
    } catch (error) {
      setForms(snapshot)
      window.alert(error instanceof ApiError ? error.message : 'Could not delete the form.')
    }
  }

  return (
    <PageContainer>
      <section className="grid h-65.5 grid-cols-[minmax(320px,419px)_minmax(420px,562px)] items-center gap-14.25 max-[1200px]:h-auto max-[1200px]:grid-cols-1 max-[1200px]:gap-6 max-[1200px]:py-12 max-[1200px]:pb-7 max-[560px]:py-8">
        <div className="pt-10 max-[1200px]:pt-0">
          <h1 className="m-0 mb-5.25 text-[32px] leading-[1.12] font-semibold tracking-[0.32px] text-black max-[560px]:text-[28px]">
            Welcome back, {firstName(user)}! 👋
          </h1>
          <p className="m-0 text-[16px] leading-[25.376px] font-normal tracking-[0.16px] text-black">
            Manage your feedback and view AI-powered analytics
          </p>
        </div>
        <HeroGraphic />
      </section>

      <section className="pt-4" aria-labelledby="recent-title">
        <h2
          className="m-0 text-[16px] leading-[25.376px] font-normal tracking-[0.16px] text-black"
          id="recent-title"
        >
          Recent forms
        </h2>

        {status === 'loading' ? (
          <p className="mt-6.5 text-[14px] text-[#8b8e98]">Loading your forms…</p>
        ) : status === 'error' ? (
          <div className="mt-6.5 flex flex-wrap items-center gap-3 text-[14px] text-[#e0507a]">
            <span>{errorMessage}</span>
            <button
              className="cursor-pointer rounded-[5px] border border-[#e0507a] px-3 py-1 text-[13px] font-medium text-[#e0507a] transition-colors hover:bg-[#fcf3f6]"
              onClick={retryLoad}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : forms.length === 0 ? (
          <p className="mt-6.5 text-[14px] text-[#8b8e98]">
            No forms yet — create your first form to get started.
          </p>
        ) : (
          <div className="mt-6.5 grid grid-cols-[repeat(auto-fit,minmax(min(235px,100%),235px))] gap-x-8 gap-y-5.25 max-[560px]:grid-cols-1">
            {forms.map((form) => (
              <FormCard
                key={form.id}
                image={placeholderImage(form.id)}
                title={form.formTitle ?? 'Untitled form'}
                updatedAt={formatRelativeTime(form.updatedAt ?? form.createdAt)}
                onDelete={() => handleDeleteForm(form.id)}
                onOpen={() => navigate(`/forms/${form.id}`)}
              />
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  )
}
