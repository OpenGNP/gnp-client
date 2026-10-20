import { useLocation, useNavigate } from 'react-router-dom'

import { ErrorCard } from '../components/ErrorCard'
import { brand } from '../data/dashboard'

/**
 * Any address the app has no page for. Says so rather than redirecting quietly. "Go back"
 * only when there's a page of ours to go back to: opened from a bookmark or another
 * site, the router's first location is keyed 'default', and back would leave the app.
 */
export function NotFoundPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const canGoBack = location.key !== 'default'

  return (
    <div className="flex flex-col items-center gap-6 px-4 pt-16">
      <img alt={brand.name} className="h-9.5 w-18.25 object-cover object-center" src={brand.logo} />
      <ErrorCard
        description="The link may be wrong, or the page has moved."
        primaryAction={canGoBack ? { label: 'Go back', onClick: () => navigate(-1) } : undefined}
        secondaryAction={{ label: 'Back to Home', to: '/' }}
        title="This page doesn't exist"
      />
    </div>
  )
}
