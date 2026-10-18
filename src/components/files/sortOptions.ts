export type SortKey = 'name' | 'opened' | 'modified' | 'created'
export type SortDir = 'asc' | 'desc'

// Sensible default direction when the sort key is switched (A→Z for names,
// newest-first for dates); the user can still flip it with the toggle.
export const DEFAULT_SORT_DIR: Record<SortKey, SortDir> = {
  name: 'asc',
  opened: 'desc',
  modified: 'desc',
  created: 'desc',
}
