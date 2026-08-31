const RAW_MAIN_DOMAIN = import.meta.env.VITE_MAIN_DOMAIN || 'http://localhost:5000'
const MAIN_DOMAIN = String(RAW_MAIN_DOMAIN).replace(/\/+$/, '')
const API_ROOT = String(import.meta.env.VITE_API_URL || `${MAIN_DOMAIN}/api`).replace(/\/+$/, '')

/** Sentinel used for the SUPER_ADMIN console, which belongs to no restaurant. */
export const PLATFORM_SCOPE = '__platform__'

/**
 * Base URL for one restaurant's API surface.
 * Everything tenant-owned lives under /api/r/:slug/...
 */
export function tenantApiBase(slug) {
  if (!slug) throw new Error('tenantApiBase() called without a restaurant slug')
  return `${API_ROOT}/r/${encodeURIComponent(slug)}`
}

/** Base URL for the platform console (SUPER_ADMIN only). */
export function platformApiBase() {
  return `${API_ROOT}/platform`
}

/** Where the browser is sent to start Google OAuth for a given scope. */
export function oauthStartUrl(slug) {
  return slug === PLATFORM_SCOPE
    ? `${API_ROOT}/auth/platform/google`
    : `${tenantApiBase(slug)}/auth/google`
}

export { MAIN_DOMAIN, API_ROOT }
