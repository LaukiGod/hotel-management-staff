export const CUSTOMER_SESSION_KEY = 'customerSession'

const RESUMABLE_PATHS = new Set(['/customer/menu', '/customer/track'])

export function getCustomerSession() {
  try {
    const raw = localStorage.getItem(CUSTOMER_SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw)
    if (session.updatedAt) {
      const updatedTime = new Date(session.updatedAt).getTime()
      const now = Date.now()
      const fourHours = 4 * 60 * 60 * 1000
      if (now - updatedTime > fourHours) {
        // Keep only name and phoneNo
        const cleaned = {
          name: session.name,
          phoneNo: session.phoneNo,
          updatedAt: new Date().toISOString()
        }
        localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(cleaned))
        return cleaned
      }
    }
    return session
  } catch {
    return null
  }
}

export function setCustomerSession(session) {
  const withTimestamp = { ...session, updatedAt: new Date().toISOString() }
  localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(withTimestamp))
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
