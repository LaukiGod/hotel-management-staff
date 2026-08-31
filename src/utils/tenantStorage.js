import { getActiveTenant } from '../api/client'

/**
 * Namespaces a browser-storage key by the active restaurant.
 *
 * Without this, a tablet used as a kiosk for two restaurants — or a phone that
 * scanned QR codes at both — would share one cart, one table session and one set
 * of admin filters between them. Keys are per tenant so the flows stay separate.
 */
export function tenantKey(baseKey) {
  const slug = getActiveTenant()
  return slug ? `${baseKey}::${slug}` : baseKey
}

export function readJSON(baseKey, fallback = null) {
  try {
    const raw = localStorage.getItem(tenantKey(baseKey))
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function writeJSON(baseKey, value) {
  try {
    localStorage.setItem(tenantKey(baseKey), JSON.stringify(value))
  } catch {
    // storage unavailable (private mode, quota) — the app still works, just without resume
  }
}

export function removeKey(baseKey) {
  try {
    localStorage.removeItem(tenantKey(baseKey))
  } catch {
    // ignore
  }
}
