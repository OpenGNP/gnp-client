/** The app URL for a form, by its `urlId` — never the sequential database id. */
export function formPath(urlId: string, view?: 'dashboard') {
  return `/forms/${encodeURIComponent(urlId)}${view ? `/${view}` : ''}`
}
