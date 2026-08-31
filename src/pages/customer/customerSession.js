import { readJSON, writeJSON, removeKey, tenantKey } from '../../utils/tenantStorage'

const CUSTOMER_SESSION_BASE = 'customerSession'

/** Per-restaurant storage key — see utils/tenantStorage. */
export const customerSessionKey = () => tenantKey(CUSTOMER_SESSION_BASE)

const RESUMABLE_PATHS = new Set(['/customer/menu', '/customer/track'])

export function getCustomerSession() {
  return readJSON(CUSTOMER_SESSION_BASE, null)
}

export function setCustomerSession(session) {
  writeJSON(CUSTOMER_SESSION_BASE, session)
}

export function patchCustomerSession(partial) {
  const prev = getCustomerSession()
  if (!prev) return
  setCustomerSession({ ...prev, ...partial })
}

/** Persist last customer route so refresh / return to login restores menu vs tracking. */
export function setCustomerResumePath(path) {
  if (!RESUMABLE_PATHS.has(path)) return
  patchCustomerSession({ resumePath: path })
}

export function clearCustomerSession() {
  removeKey(CUSTOMER_SESSION_BASE)
}

/** Browse-first: table chosen via GET / quick link; name/phone collected at order confirm. */
export function isQuickBrowseSession(s) {
  return Boolean(s?.tableNo) && s?.flow === 'quick' && !s?.userId
}

export function setQuickBrowseSession(tableNo) {
  const n = Number(tableNo)
  if (!Number.isFinite(n) || n <= 0) return
  setCustomerSession({
    tableNo: n,
    flow: 'quick',
    resumePath: '/customer/menu',
  })
}
