import { useEffect, useState } from 'react'

import type { SaveStatus } from '../components/navigation/FormActionBar'

const SAVE_DELAY_MS = 1200

export function useAutoSaveStatus() {
  const [status, setStatus] = useState<SaveStatus>(() =>
    navigator.onLine ? 'saving' : 'error',
  )

  useEffect(() => {
    if (status !== 'saving') {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setStatus(navigator.onLine ? 'saved' : 'error')
    }, SAVE_DELAY_MS)

    return () => window.clearTimeout(timeoutId)
  }, [status])

  useEffect(() => {
    function handleOffline() {
      setStatus('error')
    }

    function handleOnline() {
      setStatus('saving')
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  return status
}
