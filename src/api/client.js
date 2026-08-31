import { tenantApiBase, platformApiBase, PLATFORM_SCOPE } from '../config/api'

/**
 * The active restaurant for this browser tab.
 *
 * Pages keep calling `api.get('/restaurant/orders')` exactly as before; the slug
 * is injected here rather than threaded through every call site. `TenantProvider`
 * sets it from the `:slug` route param before any child renders.
 */
let activeSlug = null

export function setActiveTenant(slug) {
  activeSlug = slug || null
}

export function getActiveTenant() {
  return activeSlug
}

/** Tokens are stored per tenant so signing into one restaurant in a tab does not
 *  hand you a session at another. */
export function tokenKey(slug) {
  return `token:${slug || activeSlug || PLATFORM_SCOPE}`
}

export function getToken(slug) {
  try {
    return sessionStorage.getItem(tokenKey(slug))
  } catch {
    return null
  }
}

export function setToken(slug, token) {
  sessionStorage.setItem(tokenKey(slug), token)
}

export function clearToken(slug) {
  sessionStorage.removeItem(tokenKey(slug))
}

async function request(base, path, options = {}, slug) {
  const token = getToken(slug)
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${base}${path}`, { ...options, headers, credentials: 'include' })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    const error = new Error(err.message || 'Request failed')
    error.status = res.status
    throw error
  }

  return res.json()
}

/** Tenant-scoped fetch. Requires an active restaurant. */
export async function apiFetch(path, options = {}) {
  if (!activeSlug) {
    throw new Error('No restaurant selected — open the app under /r/:slug')
  }
  return request(tenantApiBase(activeSlug), path, options, activeSlug)
}

/** Platform-scoped fetch (SUPER_ADMIN console). */
export async function platformFetch(path, options = {}) {
  return request(platformApiBase(), path, options, PLATFORM_SCOPE)
}

function methods(fetcher) {
  return {
    get: (path) => fetcher(path),
    post: (path, body) => fetcher(path, { method: 'POST', body: JSON.stringify(body) }),
    put: (path, body) => fetcher(path, { method: 'PUT', body: JSON.stringify(body) }),
    patch: (path, body) => fetcher(path, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (path, body) =>
      fetcher(path, { method: 'DELETE', ...(body ? { body: JSON.stringify(body) } : {}) }),
  }
}

export const api = methods(apiFetch)
export const platformApi = methods(platformFetch)

/** Raw URL builder for non-JSON endpoints (QR image download). */
export function tenantUrl(path) {
  if (!activeSlug) throw new Error('No restaurant selected')
  return `${tenantApiBase(activeSlug)}${path}`
}
