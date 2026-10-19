import { X } from 'lucide-react'
import { useState } from 'react'

import { parseEmails } from '../../lib/emailList'

export type SpecificPeopleFieldProps = {
  emails: string[]
  onChange: (emails: string[]) => void
}

export function SpecificPeopleField({ emails, onChange }: SpecificPeopleFieldProps) {
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState('')

  /** Adds every email in `text` (one, or a pasted list); reports what it couldn't. */
  const addFrom = (text: string) => {
    const { valid, invalid } = parseEmails(text)
    const known = new Set(emails.map((email) => email.toLowerCase()))
    const added = valid.filter((email) => {
      const key = email.toLowerCase()
      if (known.has(key)) return false
      known.add(key)
      return true
    })
    if (added.length > 0) onChange([...emails, ...added])

    if (invalid.length > 0) {
      setInputValue(invalid.join(', '))
      setError(
        invalid.length === 1 ? `“${invalid[0]}” isn't a valid email` : `${invalid.length} entries aren't valid emails`,
      )
    } else if (valid.length > 0 && added.length === 0) {
      setInputValue('')
      setError(valid.length === 1 ? 'This person has already been added' : 'These people have already been added')
    } else if (valid.length === 0 && text.trim()) {
      setError('Enter a valid email address')
    } else {
      setInputValue('')
      setError('')
    }
  }

  const removeEmail = (email: string) => {
    onChange(emails.filter((existing) => existing !== email))
  }

  return (
    <div className="mt-3 flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <input
          className="h-9.5 min-w-0 flex-1 rounded-[5px] border border-[#e8eaf1] bg-[#f8f9fc] px-3 text-[14px] text-[#3f4045] outline-none placeholder:text-[#b0b1b3] focus:border-[#1e55c5]"
          onChange={(event) => {
            setInputValue(event.target.value)
            if (error) {
              setError('')
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',' || event.key === ';') {
              event.preventDefault()
              addFrom(inputValue)
            }
          }}
          // A pasted list (Excel column, "a@x.com, b@y.com", Outlook names) is split and added at once.
          onPaste={(event) => {
            const text = event.clipboardData.getData('text')
            if (!/[\s,;]/.test(text.trim())) return
            event.preventDefault()
            addFrom(`${inputValue} ${text}`)
          }}
          placeholder="Enter or paste emails"
          type="text"
          value={inputValue}
        />
        <button
          className="inline-flex h-9.5 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-[#1e55c5] px-3.5 text-[14px] font-medium text-[#1e55c5] transition-colors hover:bg-[#eef3ff] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!inputValue.trim()}
          onClick={() => addFrom(inputValue)}
          type="button"
        >
          Add
        </button>
      </div>

      {error ? <span className="text-[12px] text-[#e0507a]">{error}</span> : null}

      {emails.length > 0 ? (
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          {emails.map((email) => (
            <li
              className="inline-flex items-center gap-1.5 rounded-full bg-[#eef3ff] py-1 pr-1.5 pl-3 text-[12px] font-medium text-[#1e55c5]"
              key={email}
            >
              <span className="max-w-[220px] truncate">{email}</span>
              <button
                className="inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-[#1e55c5] hover:bg-[#d9e6fb] focus-visible:ring-2 focus-visible:ring-[#1e55c5]/40 focus-visible:outline-none"
                aria-label={`Remove ${email}`}
                onClick={() => removeEmail(email)}
                type="button"
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <span className="text-[12px] text-[#8b8e98]">
          No one added yet. Enter an email, or paste a list (one per line or comma-separated).
        </span>
      )}
    </div>
  )
}
