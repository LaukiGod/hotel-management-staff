import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import { useCustomerVerifySession } from '../../hooks/useCustomerVerifySession'
import CustomerLayout from './CustomerLayout'
import { normalizedLines } from './customerOrderUtils'
import { clearCustomerSession, getCustomerSession } from './customerSession'
import { usePopup } from '../../context/PopupContext'

const LINE_LABELS = {
  queued: { label: 'Received', className: 'bg-gray-100 text-gray-800' },
  preparing: { label: 'Cooking', className: 'bg-amber-100 text-amber-900' },
  ready: { label: 'Ready', className: 'bg-cyan-100 text-cyan-900' },
  served: { label: 'Served', className: 'bg-emerald-100 text-emerald-900' },
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
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [mealCompleted, setMealCompleted] = useState(false)

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

  async function confirmMealComplete() {
    setCompleting(true)
    try {
      await api.post('/user/meal-complete', { tableNo: session.tableNo })
      setMealCompleted(true)
      setCompleteConfirmOpen(false)
      setTimeout(() => {
        document.getElementById('customer-review-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (e) {
      notify.error(e.message)
    } finally {
      setCompleting(false)
    }
  }

  async function submitReview() {
    if (!latestOrder?._id) return
    try {
      await api.post('/user/review', { orderId: latestOrder._id, rating, comment })
      notify.success('Review submitted. Thank you!')
      if (mealCompleted) {
        clearCustomerSession()
        navigate('/tables', { replace: true })
      }
    } catch (e) {
      notify.error(e.message)
    }
  }

  function exitTable() {
    // If meal is complete, clear the session fully before going home.
    // Otherwise keep the session alive so Welcome can resume back here.
    if (mealCompleted) {
      clearCustomerSession()
    }
    navigate('/', { replace: true })
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
        <button onClick={() => setCompleteConfirmOpen(true)} className="px-3 py-2 text-sm bg-gray-900 text-white rounded-lg">
          Mark Meal Completed
        </button>
      </div>

      <div
        id="customer-review-anchor"
        className={`mt-6 rounded-xl border p-4 scroll-mt-20 transition-all duration-300 ${mealCompleted
          ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200'
          : 'bg-white border-gray-200'
          }`}
      >
        {mealCompleted ? (
          <div className="mb-4 flex items-start gap-3">
            <span className="text-2xl leading-none mt-0.5">🎉</span>
            <div>
              <p className="font-semibold text-emerald-900">Meal completed!</p>
              <p className="text-sm text-emerald-800 mt-0.5">
                Please let the waiter know so they can clear the table. Leave us a review before you go!
              </p>
            </div>
          </div>
        ) : allLatestServed ? (
          <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 mb-3">
            All items served — tell us how we did below.
          </p>
        ) : null}
        <p className={`font-medium mb-3 ${mealCompleted ? 'text-emerald-900 text-base' : 'text-gray-800'}`}>
          Leave a Review
        </p>
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            {[5, 4, 3, 2, 1].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRating(r)}
                className={`w-10 h-10 rounded-xl border text-lg transition ${r <= rating
                  ? 'bg-amber-100 border-amber-300 text-amber-500'
                  : 'bg-white border-gray-300 text-gray-400 hover:bg-gray-50'
                  }`}
                aria-label={`${r} stars`}
              >
                ★
              </button>
            ))}
          </div>
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us what you liked…"
            className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-500 ${mealCompleted ? 'border-emerald-300 bg-white' : 'border-gray-300'
              }`}
          />
          <button
            onClick={submitReview}
            className={`w-full py-2.5 text-sm font-semibold rounded-xl transition ${mealCompleted
              ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
              : 'bg-gray-900 hover:bg-gray-800 text-white'
              }`}
          >
            {mealCompleted ? 'Submit review & exit' : 'Submit review'}
          </button>
          {mealCompleted && (
            <button
              type="button"
              onClick={() => { clearCustomerSession(); navigate('/tables', { replace: true }) }}
              className="w-full py-2 text-sm text-emerald-800 hover:text-emerald-900 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition"
            >
              Skip review — exit table
            </button>
          )}
        </div>
      </div>

      <button onClick={exitTable} className="mt-6 text-sm text-gray-500 hover:text-gray-800">
        Back to Welcome
      </button>

      {completeConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !completing && setCompleteConfirmOpen(false)}
            role="presentation"
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-xl p-5">
            <h2 className="text-lg font-bold text-gray-900">Complete your meal?</h2>
            <p className="text-sm text-gray-500 mt-1">Table #{session?.tableNo}</p>

            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 space-y-1.5">
              <p className="text-sm font-semibold text-amber-900">Before you confirm:</p>
              <p className="text-sm text-amber-800">
                • You will stay on this page and can leave a review.
              </p>
              <p className="text-sm text-amber-800">
                • Please let the waiter know so they can clear and mark this table as available for the next guest.
              </p>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                disabled={completing}
                onClick={() => setCompleteConfirmOpen(false)}
                className="flex-1 py-2.5 text-sm border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={completing}
                onClick={confirmMealComplete}
                className="flex-1 py-2.5 text-sm bg-gray-900 text-white rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {completing ? (
                  <span className="inline-block w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : null}
                {completing ? 'Completing…' : 'Yes, complete meal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </CustomerLayout>
  )
}