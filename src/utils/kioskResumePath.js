/**
 * Computes where to send the user when they open the kiosk at `/` and a prior session exists.
 * Uses persisted `kioskPath` (see KioskSessionContext) plus `tableNo`, `user`, `orderId`.
 */
export function getKioskResumePath(s) {
  const tableNo = s?.tableNo
  const user = s?.user
  const orderId = s?.orderId
  const rawPath = s?.kioskPath || null
  // If we already have an identity, "/tables" is a stale value (e.g. briefly before next sync) — re-infer.
  const kioskPath =
    rawPath === '/tables' && (tableNo != null && user != null) ? null : rawPath

  function valid(path) {
    if (path === '/tables') return true
    if (path === '/register') return tableNo != null
    if (path === '/menu') return tableNo != null && user != null
    if (path === '/payment') return tableNo != null && user != null && orderId != null
    if (path === '/order-success') return tableNo != null && user != null
    return false
  }

  if (kioskPath && valid(kioskPath)) return kioskPath

  if (!tableNo) {
    if (kioskPath === '/tables') return '/tables'
    return null
  }
  if (!user) return '/register'
  if (kioskPath === '/order-success') return '/order-success'
  if (orderId) return '/payment'
  return '/menu'
}
