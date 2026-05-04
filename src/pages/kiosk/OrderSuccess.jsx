import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { kioskAxios } from '../../api/kioskAxios'
import KioskShell from '../../components/KioskShell'
import { useKioskSession } from '../../context/KioskSessionContext'

export default function KioskOrderSuccess() {
  const navigate = useNavigate()
  const { tableNo, cart, orderId, resetSession } = useKioskSession()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [reviewSaving, setReviewSaving] = useState(false)
  const [waiterCalling, setWaiterCalling] = useState(false)
  const [latestOrder, setLatestOrder] = useState(null)

  const total = useMemo(() => cart.reduce((sum, i) => sum + (Number(i.qty) || 0) * (Number(i.dish?.price) || 0), 0), [cart])

  useEffect(() => {
    if (!tableNo) {
      navigate('/', { replace: true })
      return
    }
    kioskAxios
      .get(`/user/orders/${Number(tableNo)}`)
      .then((r) => {
        const list = Array.isArray(r.data) ? r.data : r.data?.orders || []
        setLatestOrder(list[0] || null)
      })
      .catch(() => {})
  }, [navigate, tableNo])

  async function submitReview() {
    if (!orderId || reviewSaving) return
    setReviewSaving(true)
    try {
      await kioskAxios.post('/user/review', { orderId, rating, comment: comment.trim() })
    } catch (e) {
      alert(e?.response?.data?.message || e.message || 'Failed to submit review')
    } finally {
      setReviewSaving(false)
    }
  }

  async function callWaiter() {
    if (!tableNo || waiterCalling) return
    setWaiterCalling(true)
    try {
      await kioskAxios.post('/user/call-waiter', { tableNo: Number(tableNo) })
    } catch (e) {
      alert(e?.response?.data?.message || e.message || 'Failed to call waiter')
    } finally {
      setWaiterCalling(false)
    }
  }

  function newOrder() {
    resetSession()
    navigate('/', { replace: true })
  }

  return (
    <KioskShell>
      <div className="min-h-screen w-full flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-3xl rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-gray-500 text-sm">Step 5 of 5</p>
          <div className="mt-2 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold">Order placed</h1>
              <p className="mt-2 text-sm text-gray-600">
                Status:{' '}
                <span className="text-gray-900 font-semibold">{latestOrder?.status || 'confirmed'}</span>
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Order: <span className="text-gray-900 font-semibold">{orderId || latestOrder?._id || '—'}</span> • Table:{' '}
                <span className="text-gray-900 font-semibold">#{tableNo}</span>
              </p>
            </div>

            <SuccessMark />
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <h2 className="font-extrabold text-lg">Summary</h2>
              <div className="mt-4 space-y-3 max-h-[260px] overflow-auto pr-1">
                {cart.map((i) => {
                  const idKey = i.dish?.dishId || i.dish?._id
                  return (
                    <div key={idKey} className="flex items-center justify-between gap-3">
                      <p className="text-sm text-gray-900 truncate">{i.dish?.name}</p>
                      <p className="text-sm text-gray-600 shrink-0">
                        ×{i.qty} • ₹{Math.round((Number(i.qty) || 0) * (Number(i.dish?.price) || 0))}
                      </p>
                    </div>
                  )
                })}
              </div>
              <div className="mt-5 flex items-center justify-between">
                <p className="text-gray-600">Total</p>
                <p className="text-2xl font-extrabold">₹{Math.round(total)}</p>
              </div>

              <button
                onClick={callWaiter}
                disabled={waiterCalling}
                className="mt-5 w-full h-12 rounded-2xl bg-gray-900 text-white font-semibold hover:bg-gray-800 disabled:opacity-50 transition"
              >
                {waiterCalling ? 'Calling…' : 'Call Waiter'}
              </button>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <h2 className="font-extrabold text-lg">Leave a review</h2>
              <div className="mt-4">
                <StarRating value={rating} onChange={setRating} />
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us what you liked…"
                  className="mt-4 w-full min-h-28 rounded-2xl bg-white border border-gray-300 p-4 text-sm outline-none focus:border-gray-500 resize-none"
                />
              </div>

              <button
                onClick={submitReview}
                disabled={!orderId || reviewSaving}
                className="mt-4 w-full h-12 rounded-2xl border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50 transition"
              >
                {reviewSaving ? 'Submitting…' : 'Submit review'}
              </button>

              <button
                onClick={newOrder}
                className="mt-4 w-full h-12 rounded-2xl bg-gray-900 text-white font-extrabold hover:bg-gray-800 transition"
              >
                New Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </KioskShell>
  )
}

function StarRating({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: 5 }).map((_, idx) => {
        const v = idx + 1
        const active = v <= value
        return (
          <button
            type="button"
            key={v}
            onClick={() => onChange(v)}
            className={`w-10 h-10 rounded-xl border transition ${
              active ? 'bg-amber-100 border-amber-300' : 'bg-white border-gray-300 hover:bg-gray-50'
            }`}
            aria-label={`${v} stars`}
          >
            <span className={`text-xl ${active ? 'text-amber-500' : 'text-gray-400'}`}>★</span>
          </button>
        )
      })}
    </div>
  )
}

function SuccessMark() {
  return (
    <div className="w-28 h-28 rounded-3xl border border-emerald-200 bg-emerald-50 flex items-center justify-center">
      <motion.svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <motion.circle
          cx="32"
          cy="32"
          r="22"
          stroke="rgba(52, 211, 153, 0.85)"
          strokeWidth="4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
        <motion.path
          d="M22 33.5l6.5 6.5L43 25.5"
          stroke="rgba(17,24,39,0.95)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
        />
      </motion.svg>
    </div>
  )
}

