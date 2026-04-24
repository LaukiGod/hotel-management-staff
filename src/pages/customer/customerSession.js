export const CUSTOMER_SESSION_KEY = 'customerSession'

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

export function clearCustomerSession() {
  localStorage.removeItem(CUSTOMER_SESSION_KEY)
}
