import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { clearCustomerSession, getCustomerSession, isQuickBrowseSession, setCustomerResumePath } from '../pages/customer/customerSession'
import { sessionMatchesTableUser } from '../pages/customer/customerOrderUtils'

/**
 * On customer pages (except login): ensure local session matches the table's seated user,
 * then persist the current path so refresh restores menu vs tracking.
 */
export function useCustomerVerifySession() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const pathname = location.pathname
    if (!pathname.startsWith('/customer/') || pathname === '/customer/login') return

    let cancelled = false

    async function run() {
      const session = getCustomerSession()
      if (!session?.tableNo) {
        navigate('/tables', { replace: true })
        return
      }
      if (isQuickBrowseSession(session)) {
        if (pathname === '/customer/track') {
          // Allow quick-browse sessions on the tracking page only if the table
          // already has orders (e.g. staff added items). Otherwise send them to menu.
          try {
            const orders = await api.get(`/user/orders/${session.tableNo}`)
            if (cancelled) return
            const hasOrders = Array.isArray(orders) ? orders.length > 0 : false
            if (!hasOrders) {
              navigate('/customer/menu', { replace: true })
              return
            }
          } catch {
            if (cancelled) return
            navigate('/customer/menu', { replace: true })
            return
          }
        }
        if (pathname === '/customer/menu' || pathname === '/customer/track') {
          setCustomerResumePath(pathname)
        }
        return
      }
      try {
        const ts = await api.get(`/user/table-session/${session.tableNo}`)
        if (cancelled) return
        if (!ts?.valid || !sessionMatchesTableUser(session, ts)) {
          clearCustomerSession()
          navigate('/tables', { replace: true })
          return
        }
        if (pathname === '/customer/menu' || pathname === '/customer/track') {
          setCustomerResumePath(pathname)
        }
      } catch {
        if (cancelled) return
        clearCustomerSession()
        navigate('/tables', { replace: true })
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [navigate, location.pathname])
}
