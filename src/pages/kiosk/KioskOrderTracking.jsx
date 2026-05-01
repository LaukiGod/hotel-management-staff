import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { kioskAxios } from '../../api/kioskAxios'
import KioskShell from '../../components/KioskShell'
import { useKioskSession } from '../../context/KioskSessionContext'

const POLL_MS = 3000

const LINE_LABELS = {
  queued: { label: 'Received', className: 'bg-white/10 text-white/90 border-white/15' },
  preparing: { label: 'Cooking', className: 'bg-amber-500/20 text-amber-200 border-amber-400/30' },
  ready: { label: 'Ready', className: 'bg-cyan-500/15 text-cyan-100 border-cyan-400/25' },
  served: { label: 'Served', className: 'bg-emerald-500/15 text-emerald-100 border-emerald-400/25' },
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
        <p className="text-white/70 text-sm">Step 4 of 5</p>
        <h1 className="text-3xl font-extrabold mt-1">Order confirmed</h1>
        <p className="mt-2 text-sm text-white/70">
          Table #{tableNo} · Live status per item
        </p>

        {error ? <p className="mt-4 text-red-300 text-sm">{error}</p> : null}

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-white/60">Order</p>
            <p className="font-mono text-sm text-white/90">#{String(orderId).slice(-8)}</p>
          </div>
          <p className="mt-1 text-xs text-white/50">
            {order?.status ? `Kitchen ticket: ${order.status}` : 'Loading…'}
          </p>

          <ul className="mt-6 space-y-3">
            {lines.length === 0 ? (
              <li className="text-sm text-white/50 py-4 text-center">Waiting for order details…</li>
            ) : (
              lines.map((li, i) => {
                const dish = li.dish || {}
                const st = li.status || 'queued'
                const meta = LINE_LABELS[st] || LINE_LABELS.queued
                return (
                  <li
                    key={li._id || `${dish._id || dish.dishId || 'row'}-${i}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{dish.name || 'Item'}</p>
                      {dish.price != null ? (
                        <p className="text-xs text-white/50 mt-0.5">₹{dish.price}</p>
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

        <p className="mt-6 text-center text-xs text-white/45">
          When every item is served, you will be taken to feedback.
        </p>
      </div>
    </KioskShell>
  )
}
