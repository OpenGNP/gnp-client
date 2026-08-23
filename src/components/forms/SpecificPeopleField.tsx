import { X } from 'lucide-react'
import { useState } from 'react'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type SpecificPeopleFieldProps = {
  emails: string[]
  onChange: (emails: string[]) => void
}

export function SpecificPeopleField({ emails, onChange }: SpecificPeopleFieldProps) {
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState('')

  const addEmail = () => {
    const trimmed = inputValue.trim()
    if (!trimmed) {
      return
    }
    if (!EMAIL_PATTERN.test(trimmed)) {
      setError('Enter a valid email address')
      return
    }
    if (emails.includes(trimmed)) {
      setError('This person has already been added')
      return
    }
    onChange([...emails, trimmed])
    setInputValue('')
    setError('')
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
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault()
              addEmail()
            }
          }}
          placeholder="Enter email"
          type="email"
          value={inputValue}
        />
        <button
          className="inline-flex h-9.5 shrink-0 cursor-pointer items-center justify-center rounded-[5px] border border-[#1e55c5] px-3.5 text-[14px] font-medium text-[#1e55c5] transition-colors hover:bg-[#eef3ff] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!inputValue.trim()}
          onClick={addEmail}
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
          No one added yet — enter an email and select Add.
        </span>
      )}
    </div>
  )
}
