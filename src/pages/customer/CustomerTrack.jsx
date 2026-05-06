import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import { useCustomerVerifySession } from '../../hooks/useCustomerVerifySession'
import { useToast } from '../../context/ToastContext'
import CustomerLayout from './CustomerLayout'
import { normalizedLines } from './customerOrderUtils'
import { clearCustomerSession, getCustomerSession, patchCustomerSession } from './customerSession'

const LINE_LABELS = {
  queued: { label: 'Received', className: 'bg-gray-100 text-gray-800' },
  preparing: { label: 'Cooking', className: 'bg-amber-100 text-amber-900' },
  ready: { label: 'Ready', className: 'bg-cyan-100 text-cyan-900' },
  served: { label: 'Served', className: 'bg-emerald-100 text-emerald-900' },
}

export default function CustomerTrack() {
  const navigate = useNavigate()
  const toast = useToast()
  useCustomerVerifySession()
  const session = getCustomerSession()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submittedReview, setSubmittedReview] = useState(null)

  async function loadOrders() {
    if (!session?.tableNo) return
    try {
      const data = await api.get(`/user/orders/${session.tableNo}`)
      setOrders(data)
    } catch (e) {
      toast.error(e.message)
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
      toast.success('Meal marked complete.')
    } catch (e) {
      toast.error(e.message)
    }
  }

  async function submitReview() {
    if (!latestOrder?._id || submitting) return
    setSubmitting(true)
    try {
      await api.post('/user/review', { orderId: latestOrder._id, rating, comment })
      setSubmittedReview({ rating, comment: comment.trim() })
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSubmitting(false)
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

  if (submittedReview) {
    return (
      <CustomerLayout title="Thank you">
        <div className="flex flex-col items-center text-center py-6 sm:py-10">
          <div className="relative mb-6">
            <span className="absolute inset-0 rounded-full bg-emerald-200/60 blur-xl" aria-hidden />
            <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <svg className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Thank you!</h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-sm">
            Your review for Table #{session?.tableNo} has been recorded. We hope you enjoyed your meal.
          </p>

          <div className="mt-5 flex items-center gap-1" aria-label={`${submittedReview.rating} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((s) => (
              <svg
                key={s}
                className={`h-7 w-7 ${s <= submittedReview.rating ? 'text-amber-400' : 'text-gray-200'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.518 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.539 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.075 10.1c-.783-.57-.38-1.81.588-1.81h4.915a1 1 0 00.95-.69l1.518-4.674z" />
              </svg>
            ))}
          </div>

          {submittedReview.comment ? (
            <blockquote className="mt-5 max-w-md w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 italic">
              &ldquo;{submittedReview.comment}&rdquo;
            </blockquote>
          ) : null}

          <div className="mt-8 w-full max-w-md rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 px-5 py-5 text-white shadow-lg">
            <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">See you soon</p>
            <p className="mt-1 text-lg font-semibold">Please visit us again</p>
            <p className="mt-1 text-sm text-gray-300">
              Thanks for dining with us. End your session below to free up the table for the next guest.
            </p>
            <button
              type="button"
              onClick={exitTable}
              className="mt-4 w-full rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-100 transition-colors"
            >
              Exit Table Session
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSubmittedReview(null)}
            className="mt-4 text-xs text-gray-400 hover:text-gray-600"
          >
            Back to order tracking
          </button>
        </div>
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
          <button
            onClick={submitReview}
            disabled={submitting}
            className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>

      <button onClick={exitTable} className="mt-6 text-sm text-gray-500 hover:text-gray-800">
        Exit Table Session
      </button>
    </CustomerLayout>
  )
}
