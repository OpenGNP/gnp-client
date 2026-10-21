import type { WhatChangedRow } from '../data/dashboardAnalytics'

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

/** One-line headline from the counts, e.g. "Complaints rise for 3 topics and fall for 1 topic. 2 new topics." */
export function whatChangedSummary(rows: WhatChangedRow[]): string {
  const count = (kind: WhatChangedRow['kind']) => rows.filter((row) => row.kind === kind).length
  const worse = count('worse')
  const better = count('better')
  const fresh = count('new')
  const moves = [worse ? `rise for ${plural(worse, 'topic')}` : '', better ? `fall for ${plural(better, 'topic')}` : '']
    .filter(Boolean)
    .join(' and ')
  const sentences = [moves ? `Complaints ${moves}.` : '', fresh ? `${plural(fresh, 'new topic')}.` : '']
  return sentences.filter(Boolean).join(' ') || 'No clear changes in complaints.'
}
