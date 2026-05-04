import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { kioskAxios } from '../../api/kioskAxios'
import KioskShell from '../../components/KioskShell'

export default function KioskOrderFeedback() {
  const navigate = useNavigate()
  const location = useLocation()
  const orderId = location.state?.orderId
  const tableNo = location.state?.tableNo

  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!orderId) {
      navigate('/', { replace: true })
    }
  }, [navigate, orderId])

  async function submitReview() {
    if (!orderId || saving) return
    setSaving(true)
    try {
      await kioskAxios.post('/user/review', { orderId, rating, comment: comment.trim() })
      navigate('/', { replace: true })
    } catch (e) {
      alert(e?.response?.data?.message || e.message || 'Failed to submit feedback')
    } finally {
      setSaving(false)
    }
  }

  if (!orderId) {
    return null
  }

  return (
    <KioskShell>
      <div className="min-h-screen w-full flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-gray-500 text-sm">Step 5 of 5</p>
          <h1 className="text-3xl font-extrabold mt-2">How was everything?</h1>
          {tableNo != null ? (
            <p className="mt-2 text-sm text-gray-600">Table #{tableNo}</p>
          ) : null}

          <div className="mt-8">
            <p className="text-sm text-gray-600 mb-3">Rating</p>
            <StarRating value={rating} onChange={setRating} />
          </div>

          <label className="block mt-6 text-sm text-gray-600 mb-2" htmlFor="kiosk-feedback-comment">
            Comments (optional)
          </label>
          <textarea
            id="kiosk-feedback-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us what you liked…"
            className="w-full min-h-28 rounded-2xl bg-white border border-gray-300 p-4 text-sm outline-none focus:border-gray-500 resize-none"
          />

          <button
            type="button"
            onClick={submitReview}
            disabled={saving}
            className="mt-6 w-full h-14 rounded-2xl bg-gray-900 text-white font-extrabold hover:bg-gray-800 disabled:opacity-50 transition"
          >
            {saving ? 'Submitting…' : 'Submit feedback'}
          </button>
        </div>
      </div>
    </KioskShell>
  )
}

function StarRating({ value, onChange }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {Array.from({ length: 5 }).map((_, idx) => {
        const v = idx + 1
        const active = v <= value
        return (
          <button
            type="button"
            key={v}
            onClick={() => onChange(v)}
            className={`w-11 h-11 rounded-xl border transition ${
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
