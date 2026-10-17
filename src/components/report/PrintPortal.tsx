import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/**
 * Renders `children` outside the app and opens the browser's print dialog for it
 * ("Save as PDF" there). Print CSS (index.css, `.print-only`) hides the app and
 * shows only this. `title` becomes the suggested file name; `onDone` fires once the
 * dialog closes, so the caller can unmount it.
 */
export function PrintPortal({ title, onDone, children }: { title: string; onDone: () => void; children: ReactNode }) {
  useEffect(() => {
    const previousTitle = document.title
    document.title = title
    const done = () => onDone()
    window.addEventListener('afterprint', done)
    // A frame later, so the report is laid out before the dialog snapshots it.
    const frame = requestAnimationFrame(() => window.print())
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('afterprint', done)
      document.title = previousTitle
    }
  }, [title, onDone])

  return createPortal(<div className="print-only">{children}</div>, document.body)
}
