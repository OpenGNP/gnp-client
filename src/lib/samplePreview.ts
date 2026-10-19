import { createContext } from 'react'

/**
 * True while a dashboard shows sample data (an empty form's tour). Read by controls
 * outside the page's own tree of props — e.g. Share in the top bar — to stay disabled.
 */
export const SamplePreviewContext = createContext(false)
