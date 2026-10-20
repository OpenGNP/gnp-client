import { useState } from 'react'

import { API_URL } from '../lib/api'
import { cn } from '../lib/utils'

const COLORS = ['#1e55c5', '#0b842d', '#b7791f', '#c1121f', '#6b46c1', '#0e7490']

/** "Somchai Jaidee" → "SJ"; no name → the email's first letter. */
function initialsOf(name: string | null | undefined, email: string) {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (words.length > 0) return words.slice(0, 2).map((word) => [...word][0]).join('').toUpperCase()
  return ([...email][0] ?? '?').toUpperCase()
}

// The same person keeps the same colour everywhere.
function colorOf(email: string) {
  let hash = 0
  for (const char of email.toLowerCase()) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return COLORS[Math.abs(hash) % COLORS.length]
}

/**
 * Someone's round avatar: their Microsoft photo when there is one, else their initials
 * on a colour of their own. A photo that fails to load falls back to initials too.
 */
export function UserAvatar({
  name,
  email,
  avatarUrl,
  className,
}: {
  name: string | null | undefined
  email: string
  /** From the API (`/users/:id/avatar?v=…`), or null. */
  avatarUrl?: string | null
  /** Size and text size, e.g. "size-7 text-[11px]". */
  className?: string
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const showPhoto = Boolean(avatarUrl) && failedUrl !== avatarUrl

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white',
        className,
      )}
      style={showPhoto ? undefined : { backgroundColor: colorOf(email) }}
    >
      {showPhoto ? (
        <img
          alt=""
          className="size-full object-cover"
          onError={() => setFailedUrl(avatarUrl ?? null)}
          src={`${API_URL}${avatarUrl}`}
        />
      ) : (
        initialsOf(name, email)
      )}
    </span>
  )
}
