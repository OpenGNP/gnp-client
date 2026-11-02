import type { FeedbackPoint } from '../../data/dashboardAnalytics'

/** A flag the owner hasn't confirmed or dismissed yet (dismissed points are no longer `violation`). */
export const needsReview = (point: FeedbackPoint) => Boolean(point.violation) && point.violationStatus !== 'confirmed'
