import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { Button } from '../components/ui/button'
import { brand } from '../data/dashboard'
import { ApiError } from '../lib/api'
import { useAuth } from '../lib/auth'

export function LoginPage() {
  const { login, status, user } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Already signed in (e.g. dev auto-login resolved, or a direct visit while a
  // session is live) — bounce to wherever AppGate sent us from, or home.
  if (status === 'ready' && user) {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate replace to={from || '/'} />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    setError('')
    setSubmitting(true)
    try {
      await login(email.trim(), password)
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : 'Could not sign in. Please try again.',
      )
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f9ff] px-4 font-['Inter_Variable']">
      <div className="w-full max-w-95 rounded-[10px] border border-[#e8eaf1] bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.10)]">
        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          <img alt={brand.name} className="h-9 w-auto" src={brand.logo} />
          <div>
            <h1 className="m-0 text-[18px] font-semibold text-[#14181f]">Sign in</h1>
            <p className="m-0 mt-1 text-[13px] text-[#8b8e98]">
              Sign in to your {brand.name} account
            </p>
          </div>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <label className="flex flex-col gap-1.5 text-left">
            <span className="text-[12px] font-medium text-[#3f4045]">Email</span>
            <input
              autoComplete="email"
              autoFocus
              className="h-10.5 rounded-[8px] border border-[#d7dbe6] px-3 text-[14px] text-[#14181f] outline-none transition-colors focus:border-[#1e55c5]"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              type="email"
              value={email}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-left">
            <span className="text-[12px] font-medium text-[#3f4045]">Password</span>
            <div className="relative flex items-center">
              <input
                autoComplete="current-password"
                className="h-10.5 w-full rounded-[8px] border border-[#d7dbe6] px-3 pr-10 text-[14px] text-[#14181f] outline-none transition-colors focus:border-[#1e55c5]"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
              />
              <button
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute right-3 flex cursor-pointer items-center text-[#8b8e98] transition-colors hover:text-[#3f4045]"
                onClick={() => setShowPassword((value) => !value)}
                tabIndex={-1}
                type="button"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          {error ? (
            <p
              className="m-0 rounded-[8px] bg-[#fdecec] px-3 py-2 text-[12px] text-[#c0392b]"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <Button
            className="h-10.5 w-full justify-center rounded-[8px] text-[14px] font-semibold"
            disabled={submitting}
            type="submit"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  )
}
