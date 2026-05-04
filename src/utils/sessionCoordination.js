/**
 * Bridges kiosk session (tablet flow) vs customer session (QR /customer/* flow).
 *
 * Priority rules:
 * 1. Welcome `/` resume: customer session wins if it has a table; else kiosk resume path.
 * 2. Entering customer UI (layout, QR table-select success): clear kiosk storage so cart/orderId
 *    from a prior kiosk guest does not leak into phone ordering on the same browser.
 * 3. User explicitly starts kiosk from welcome (tap → /tables): clear customer session so
 *    they are not bounced back to /customer/track on the shared device.
 */

import { getCustomerSession, clearCustomerSession, isQuickBrowseSession } from '../pages/customer/customerSession'
import { getKioskResumePath } from './kioskResumePath'

export const KIOSK_SESSION_STORAGE_KEY = 'smart-restaurant-kiosk-session-v1'

const CLEAR_KIOSK_EVENT = 'kiosk-session-cleared'

/** Customer-only resume path for `/` splash, or null. */
export function getCustomerResumePath() {
  const s = getCustomerSession()
  if (!s?.tableNo) return null
  if (isQuickBrowseSession(s)) return '/customer/menu'
  if (s?.resumePath === '/customer/track' || s?.resumePath === '/customer/menu') return s.resumePath
  return '/customer/menu'
}

/**
 * After welcome delay: where to send the user.
 * @param {object} kioskSnapshot - { tableNo, user, orderId, kioskPath } from useKioskSession()
 */
export function getCombinedResumePath(kioskSnapshot) {
  return getCustomerResumePath() || getKioskResumePath(kioskSnapshot) || null
}

/** Remove kiosk localStorage and notify KioskSessionProvider to reset in-memory state. */
export function clearKioskStorageAndNotify() {
  try {
    localStorage.removeItem(KIOSK_SESSION_STORAGE_KEY)
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CLEAR_KIOSK_EVENT))
  }
}

export const KIOSK_SESSION_CLEARED_EVENT = CLEAR_KIOSK_EVENT

/** Call when user enters customer menu/track (or right after QR table book). */
export function onCustomerFlowEnter() {
  clearKioskStorageAndNotify()
}

/** Call when user explicitly begins kiosk table selection from welcome. */
export function onKioskFlowExplicitStart() {
  clearCustomerSession()
}
