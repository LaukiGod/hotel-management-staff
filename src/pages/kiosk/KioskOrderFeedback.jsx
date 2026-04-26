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
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-8">
          <p className="text-white/70 text-sm">Step 5 of 5</p>
          <h1 className="text-3xl font-extrabold mt-2">How was everything?</h1>
          {tableNo != null ? (
            <p className="mt-2 text-sm text-white/60">Table #{tableNo}</p>
          ) : null}

          <div className="mt-8">
            <p className="text-sm text-white/70 mb-3">Rating</p>
            <StarRating value={rating} onChange={setRating} />
          </div>

          <label className="block mt-6 text-sm text-white/70 mb-2" htmlFor="kiosk-feedback-comment">
            Comments (optional)
          </label>
          <textarea
            id="kiosk-feedback-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us what you liked…"
            className="w-full min-h-28 rounded-2xl bg-black/30 border border-white/10 p-4 text-sm outline-none focus:border-white/25 resize-none"
          />

          <button
            type="button"
            onClick={submitReview}
            disabled={saving}
            className="mt-6 w-full h-14 rounded-2xl bg-white text-neutral-900 font-extrabold hover:bg-white/90 disabled:opacity-50 transition"
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
              active ? 'bg-amber-500/20 border-amber-400/30' : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
            aria-label={`${v} stars`}
          >
            <span className={`text-xl ${active ? 'text-amber-300' : 'text-white/55'}`}>★</span>
          </button>
        )
      })}
    </div>
  )
}
