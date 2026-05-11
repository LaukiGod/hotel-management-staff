import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import { useCustomerVerifySession } from '../../hooks/useCustomerVerifySession'
import CustomerLayout from './CustomerLayout'
import { normalizedLines } from './customerOrderUtils'
import { clearCustomerSession, getCustomerSession, patchCustomerSession } from './customerSession'
import { usePopup } from '../../context/PopupContext'

const LINE_LABELS = {
  queued: { label: 'Received', className: 'bg-gray-100 text-gray-800' },
  preparing: { label: 'Cooking', className: 'bg-amber-100 text-amber-900' },
  ready: { label: 'Ready', className: 'bg-cyan-100 text-cyan-900' },
  served: { label: 'Served', className: 'bg-emerald-100 text-emerald-900' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-900' },
}

export default function CustomerTrack() {
  const navigate = useNavigate()
  const notify = usePopup()
  useCustomerVerifySession()
  const session = getCustomerSession()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  async function loadOrders() {
    if (!session?.tableNo) return
    try {
      const data = await api.get(`/user/orders/${session.tableNo}`)
      setOrders(data)
    } catch (e) {
      notify.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!session?.tableNo) {
      navigate('/tables', { replace: true })
      return
    }
    loadOrders()
    const t = setInterval(loadOrders, 4000)
    return () => clearInterval(t)
  }, [navigate, session?.tableNo])

  const latestOrder = useMemo(() => orders[0], [orders])
  const latestLines = useMemo(() => normalizedLines(latestOrder), [latestOrder])
  const allLatestServed =
    latestLines.length > 0 && latestLines.every((li) => li.status === 'served')

  useEffect(() => {
    if (!allLatestServed) return
    document.getElementById('customer-review-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [allLatestServed])

  async function markMealComplete() {
    try {
      await api.post('/user/meal-complete', { tableNo: session.tableNo })
      patchCustomerSession({ resumePath: '/customer/menu' })
      await loadOrders()
      notify.success('Meal marked complete.')
    } catch (e) {
      notify.error(e.message)
    }
  }

  async function submitReview() {
    if (!latestOrder?._id) return
    try {
      await api.post('/user/review', { orderId: latestOrder._id, rating, comment })
      notify.success('Review submitted.')
    } catch (e) {
      notify.error(e.message)
    }
  }

  async function exitTable() {
    clearCustomerSession()
    try {
      await api.post('/user/clear-table', { tableNo: session.tableNo })
      navigate('/tables', { replace: true })
    } catch (e) {
      // Even if the API call fails, we still end the local session and return to table selection.
      navigate('/tables', { replace: true })
    }
  }

  if (loading) {
    return (
      <CustomerLayout title="Track Order">
        <p className="text-sm text-gray-500">Loading...</p>
      </CustomerLayout>
    )
  }

  return (
    <CustomerLayout title="Track Order">
      {orders.length > 0 ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="font-semibold text-emerald-900">Order confirmed</p>
          <p className="text-sm text-emerald-800 mt-1">Live status for each item is shown below.</p>
        </div>
      ) : null}
      <div className="space-y-3">
        {orders.map((order) => {
          const lines = normalizedLines(order)
          return (
            <div key={order._id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-800">Order #{order._id.slice(-6)}</p>
                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 capitalize">{order.status}</span>
              </div>
              {lines.length ? (
                <ul className="mt-3 space-y-2">
                  {lines.map((li, i) => {
                    const dish = li.dish || {}
                    const st = li.status || 'queued'
                    const meta = LINE_LABELS[st] || LINE_LABELS.queued
                    return (
                      <li key={li._id || `${dish._id}-${i}`} className="flex items-center justify-between gap-2 text-sm border-t border-gray-100 first:border-t-0 first:pt-0 pt-2">
                        <span className="text-gray-900 font-medium truncate">{dish.name || 'Item'}</span>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-lg shrink-0 ${meta.className}`}>{meta.label}</span>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 mt-2">{order.dishes?.map((d) => d.name).join(', ') || 'No items'}</p>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-5 flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => navigate('/customer/menu')}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg font-medium bg-white hover:bg-gray-50"
        >
          Back to menu — add more dishes
        </button>
        <button onClick={markMealComplete} className="px-3 py-2 text-sm bg-gray-900 text-white rounded-lg">
          Mark Meal Completed
        </button>
      </div>

      <div id="customer-review-anchor" className="mt-6 bg-white rounded-xl border border-gray-200 p-4 scroll-mt-20">
        {allLatestServed ? (
          <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 mb-3">
            All items served — tell us how we did below.
          </p>
        ) : null}
        <p className="font-medium text-gray-800 mb-2">Leave a Review</p>
        <div className="flex items-center gap-3 flex-wrap">
          <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="border border-gray-300 rounded-lg px-2 py-1 text-sm">
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>
                {r} Star
              </option>
            ))}
          </select>
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Comment"
            className="flex-1 min-w-[160px] border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
          />
          <button onClick={submitReview} className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg">
            Submit
          </button>
        </div>
      </div>

      <button onClick={exitTable} className="mt-6 text-sm text-gray-500 hover:text-gray-800">
        Exit Table Session
      </button>
    </CustomerLayout>
  )
}
