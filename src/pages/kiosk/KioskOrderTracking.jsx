import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { kioskAxios } from '../../api/kioskAxios'
import KioskShell from '../../components/KioskShell'
import { useKioskSession } from '../../context/KioskSessionContext'

const POLL_MS = 3000

const LINE_LABELS = {
  queued: { label: 'Received', className: 'bg-gray-100 text-gray-700 border-gray-200' },
  preparing: { label: 'Cooking', className: 'bg-amber-100 text-amber-900 border-amber-200' },
  ready: { label: 'Ready', className: 'bg-cyan-100 text-cyan-900 border-cyan-200' },
  served: { label: 'Served', className: 'bg-emerald-100 text-emerald-900 border-emerald-200' },
}

function normalizedLines(order) {
  if (!order) return []
  const raw = order.lineItems
  if (Array.isArray(raw) && raw.length) return raw
  const dishes = order.dishes || []
  const fallback =
    order.status === 'served' || order.status === 'completed'
      ? 'served'
      : order.status === 'preparing'
        ? 'preparing'
        : 'queued'
  return dishes.map((d) => ({ dish: d, status: fallback }))
}

export default function KioskOrderTracking() {
  const navigate = useNavigate()
  const { tableNo, user, orderId, resetSession } = useKioskSession()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!tableNo || !user || !orderId) {
      navigate('/tables', { replace: true })
      return
    }

    let cancelled = false

    async function load() {
      try {
        const r = await kioskAxios.get(`/user/orders/${Number(tableNo)}`)
        const list = Array.isArray(r.data) ? r.data : r.data?.orders || []
        const found = list.find((o) => String(o._id) === String(orderId)) || list[0] || null
        if (!cancelled) {
          setOrder(found)
          setError('')
        }
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.message || e.message || 'Failed to load order')
      }
    }

    load()
    const t = setInterval(load, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [navigate, tableNo, user, orderId])

  const lines = useMemo(() => normalizedLines(order), [order])
  const allServed = lines.length > 0 && lines.every((li) => li.status === 'served')
  const redirectedRef = useRef(false)

  useEffect(() => {
    if (!allServed || !orderId || redirectedRef.current) return
    redirectedRef.current = true
    navigate('/order-feedback', {
      replace: true,
      state: { orderId: String(orderId), tableNo: Number(tableNo) },
    })
    resetSession()
  }, [allServed, navigate, orderId, tableNo, resetSession])

  if (!tableNo || !user || !orderId) {
    return null
  }

  return (
    <KioskShell>
      <div className="min-h-screen w-full px-4 sm:px-6 py-10 max-w-2xl mx-auto">
        <p className="text-gray-500 text-sm">Step 4 of 5</p>
        <h1 className="text-3xl font-extrabold mt-1">Order confirmed</h1>
        <p className="mt-2 text-sm text-gray-600">
          Table #{tableNo} · Live status per item
        </p>

        {error ? <p className="mt-4 text-red-600 text-sm">{error}</p> : null}

        <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-gray-500">Order</p>
            <p className="font-mono text-sm text-gray-700">#{String(orderId).slice(-8)}</p>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {order?.status ? `Kitchen ticket: ${order.status}` : 'Loading…'}
          </p>

          <ul className="mt-6 space-y-3">
            {lines.length === 0 ? (
              <li className="text-sm text-gray-500 py-4 text-center">Waiting for order details…</li>
            ) : (
              lines.map((li, i) => {
                const dish = li.dish || {}
                const st = li.status || 'queued'
                const meta = LINE_LABELS[st] || LINE_LABELS.queued
                return (
                  <li
                    key={li._id || `${dish._id || dish.dishId || 'row'}-${i}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{dish.name || 'Item'}</p>
                      {dish.price != null ? (
                        <p className="text-xs text-gray-500 mt-0.5">₹{dish.price}</p>
                      ) : null}
                    </div>
                    <span
                      className={`shrink-0 text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-xl border ${meta.className}`}
                    >
                      {meta.label}
                    </span>
                  </li>
                )
              })
            )}
          </ul>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          When every item is served, you will be taken to feedback.
        </p>
      </div>
    </KioskShell>
  )
}
