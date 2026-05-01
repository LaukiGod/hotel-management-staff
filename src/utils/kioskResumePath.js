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
    if (path === '/payment') return tableNo != null && user != null && orderId != null
    if (path === '/order-tracking') return tableNo != null && user != null && orderId != null
    if (path === '/order-success') return tableNo != null && user != null
    return false
  }

  if (kioskPath && valid(kioskPath)) return kioskPath

  if (!tableNo) {
    if (kioskPath === '/tables') return '/tables'
    return null
  }
  if (!user) return '/tables'
  if (kioskPath === '/order-success') return '/order-success'
  if (kioskPath === '/order-tracking') return '/order-tracking'
  if (orderId) return '/order-tracking'
  return '/tables'
}
