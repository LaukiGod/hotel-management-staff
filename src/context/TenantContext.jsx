import { createContext, useContext, useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation, Outlet } from 'react-router-dom'
import { setActiveTenant } from '../api/client'
import { tenantApiBase } from '../config/api'

const TenantContext = createContext(null)

/**
 * Binds everything below it to one restaurant.
 *
 * `setActiveTenant` runs during render rather than in an effect on purpose: the
 * API client must know the slug before any child's first data fetch fires, and
 * effects in children run before effects in parents.
 */
export function TenantProvider() {
  const { slug } = useParams()
  const [restaurant, setRestaurant] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [error, setError] = useState('')

  if (typeof window !== 'undefined') {
    setActiveTenant(slug)
  }

  useEffect(() => {
    let cancelled = false
    setActiveTenant(slug)
    setStatus('loading')
    setError('')

    async function load() {
      try {
        const res = await fetch(`${tenantApiBase(slug)}/user/restaurant`)
        const body = await res.json().catch(() => ({}))
        if (cancelled) return

        if (!res.ok) {
          setError(body.message || `Restaurant "${slug}" is not available`)
          setStatus('error')
          return
        }
        setRestaurant(body)
        setStatus('ready')
      } catch {
        if (!cancelled) {
          setError('Could not reach the server. Is the backend running?')
          setStatus('error')
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [slug])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-gray-400">
        <p>Loading restaurant…</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-900 px-6 text-center">
        <h1 className="text-2xl font-semibold text-white">Restaurant unavailable</h1>
        <p className="max-w-md text-gray-400">{error}</p>
        <p className="text-sm text-gray-500">
          Checked <code className="rounded bg-gray-800 px-1.5 py-0.5">/r/{slug}</code>
        </p>
      </div>
    )
  }

  return (
    <TenantContext.Provider value={{ slug, restaurant }}>
      <Outlet />
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const ctx = useContext(TenantContext)
  if (!ctx) throw new Error('useTenant must be used within a TenantProvider (a /r/:slug route)')
  return ctx
}

/** Slug without requiring the provider — safe in components shared with /platform. */
export function useOptionalTenant() {
  return useContext(TenantContext)
}

/**
 * Prefixes an app-absolute path with the active tenant.
 * `/tables` -> `/r/bella-vista/tables`
 */
export function useTenantPath() {
  const { slug } = useTenant()
  return (path) => {
    if (typeof path !== 'string' || !path.startsWith('/')) return path
    return `/r/${slug}${path === '/' ? '' : path}`
  }
}

/**
 * Drop-in replacement for `useNavigate` inside tenant routes.
 *
 * Every existing `navigate('/tables')` keeps working unchanged — the slug is
 * added here instead of at ~35 call sites. Numeric args (`navigate(-1)`) and
 * already-prefixed paths pass through untouched.
 */
export function useTenantNavigate() {
  const navigate = useNavigate()
  const toTenantPath = useTenantPath()

  return (to, options) => {
    if (typeof to === 'number') return navigate(to)
    if (typeof to === 'string') return navigate(toTenantPath(to), options)
    if (to && typeof to === 'object' && typeof to.pathname === 'string') {
      return navigate({ ...to, pathname: toTenantPath(to.pathname) }, options)
    }
    return navigate(to, options)
  }
}

/** Current location with the /r/:slug prefix stripped, for matching nav items. */
export function useTenantRelativePath() {
  const { slug } = useTenant()
  const { pathname } = useLocation()
  const prefix = `/r/${slug}`
  return pathname.startsWith(prefix) ? pathname.slice(prefix.length) || '/' : pathname
}
