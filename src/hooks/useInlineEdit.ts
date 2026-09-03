import {
  type ChangeEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react'

type UseInlineEditOptions = {
  initialValue: string
  onCommit: (value: string) => void
  onCancel: () => void
}

/**
 * Drives an inline rename / create text field: autofocus + select on mount,
 * Enter or blur commits (only when non-empty and actually changed), Escape
 * cancels. Guards against the Enter-then-blur double fire and against a stray
 * pre-focus blur (e.g. a closing menu handing focus back to its trigger).
 */
export function useInlineEdit({
  initialValue,
  onCommit,
  onCancel,
}: UseInlineEditOptions) {
  const [value, setValue] = useState(initialValue)
  const isDoneRef = useRef(false)
  const hasFocusedRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const focus = () => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
    focus()
    const frame = requestAnimationFrame(focus)
    return () => cancelAnimationFrame(frame)
  }, [])

  function commit() {
    if (isDoneRef.current) {
      return
    }
    isDoneRef.current = true

    const trimmed = value.trim()
    if (trimmed && trimmed !== initialValue) {
      onCommit(trimmed)
    } else {
      onCancel()
    }
  }

  return {
    value,
    inputProps: {
      ref: inputRef,
      value,
      onChange: (event: ChangeEvent<HTMLInputElement>) => setValue(event.target.value),
      onBlur: () => {
        if (hasFocusedRef.current) {
          commit()
        }
      },
      onFocus: () => {
        hasFocusedRef.current = true
      },
      onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          commit()
        } else if (event.key === 'Escape') {
          event.preventDefault()
          isDoneRef.current = true
          onCancel()
        }
      },
    },
  }
}
