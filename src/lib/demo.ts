import { createContext } from 'react'

import { ApiError } from './api'

/**
 * The public /demo: the real editor and dashboard on the server's demo form (its /demo
 * routes, no sign-in). The API layer reads from those routes for this id and refuses to
 * save, so every button works up to the point where something would be stored.
 */
export const DEMO_FORM_ID = -1

/** True inside /demo, for the few places that route or record differently there. */
export const DemoContext = createContext(false)

/** Why a save in the demo fails; shown by whichever dialog or alert tried to save. */
export const demoSaveError = () =>
  new ApiError('This is the demo, so nothing is saved. Sign in to build and share your own form.', 403)
