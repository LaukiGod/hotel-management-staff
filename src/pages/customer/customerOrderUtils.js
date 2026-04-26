/** One row per item for tracking (matches backend `lineItems` or legacy `dishes` + order status). */
export function normalizedLines(order) {
  if (!order) return []
  if (Array.isArray(order.lineItems) && order.lineItems.length) return order.lineItems
  const dishes = order.dishes || []
  const fallback =
    order.status === 'served' || order.status === 'completed'
      ? 'served'
      : order.status === 'preparing'
        ? 'preparing'
        : 'queued'
  return dishes.map((d) => ({ dish: d, status: fallback }))
}

/** True if this table still has at least one non-completed order (menu, tracking, or review). */
export function tableHasOpenCustomerTicket(orders) {
  if (!Array.isArray(orders) || orders.length === 0) return false
  return orders.some((o) => o.status !== 'completed')
}

/** Session belongs to the user currently seated at the table (Mongo user id, or phone fallback). */
export function sessionMatchesTableUser(session, tableSession) {
  if (!session || !tableSession?.valid) return false
  const sid = session.userId != null ? String(session.userId).trim() : ''
  if (sid && tableSession.userId) return sid === String(tableSession.userId)
  const digits = (x) => String(x || '').replace(/\D/g, '')
  return digits(session.phoneNo) === digits(tableSession.phoneNo)
}
