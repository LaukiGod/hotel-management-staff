export const CUSTOMER_SESSION_KEY = 'customerSession'

const RESUMABLE_PATHS = new Set(['/customer/menu', '/customer/track'])

export function getCustomerSession() {
  try {
    const raw = localStorage.getItem(CUSTOMER_SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setCustomerSession(session) {
  localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(session))
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
  localStorage.removeItem(CUSTOMER_SESSION_KEY)
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
