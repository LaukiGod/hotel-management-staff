import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { kioskAxios } from '../../api/kioskAxios'
import KioskShell from '../../components/KioskShell'
import { useKioskSession } from '../../context/KioskSessionContext'

const PAYMENT_WINDOW_MS = 10 * 60 * 1000

export default function KioskPayment() {
  const navigate = useNavigate()
  const { orderId, tableNo } = useKioskSession()
  const [utr, setUtr] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const startedAt = useRef(Date.now())

  useEffect(() => {
    if (!orderId) {
      navigate('/tables', { replace: true })
      return
    }
  }, [navigate, orderId])

  const upiId = import.meta.env.VITE_UPI_ID || 'yourupi@bank'

  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const remainingMs = Math.max(0, PAYMENT_WINDOW_MS - (now - startedAt.current))
  const remainingText = useMemo(() => {
    const s = Math.floor(remainingMs / 1000)
    const m = Math.floor(s / 60)
    const r = s % 60
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
  }, [remainingMs])

  async function copyUpi() {
    try {
      await navigator.clipboard.writeText(upiId)
    } catch {
      // ignore
    }
  }

  async function confirm() {
    if (!utr.trim() || submitting) return
    setSubmitting(true)
    setError('')
    try {
      await kioskAxios.post('/user/pay', { orderId, upiReference: utr.trim() })
      navigate('/order-tracking')
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Payment confirmation failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <KioskShell>
      <div className="min-h-screen w-full flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-7">
          <p className="text-white/70 text-sm">Step 4 of 5</p>
          <h1 className="text-3xl font-extrabold mt-1">Pay via UPI</h1>
          <p className="mt-2 text-sm text-white/70">
            Table #{tableNo} • Payment window: <span className="font-semibold text-white">{remainingText}</span>
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="aspect-square rounded-xl bg-white flex items-center justify-center overflow-hidden">
                <img
                  alt="UPI QR"
                  className="w-full h-full object-contain"
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiId)}`}
                />
              </div>
              <p className="mt-3 text-xs text-white/70">Scan QR to pay</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-xs text-white/70">UPI ID</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="font-semibold break-all">{upiId}</p>
                <button onClick={copyUpi} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition text-sm">
                  Copy
                </button>
              </div>

              <div className="mt-5">
                <label className="block text-xs text-white/70 mb-2">UTR / Transaction reference</label>
                <input
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  placeholder="Enter UTR number"
                  className="w-full h-12 rounded-2xl bg-black/30 border border-white/10 px-4 text-sm outline-none focus:border-white/25"
                />
                <p className="mt-2 text-xs text-white/60">After payment, enter your UTR to confirm.</p>
              </div>

              {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

              <button
                onClick={confirm}
                disabled={!utr.trim() || submitting || remainingMs === 0}
                className="mt-5 w-full h-12 rounded-2xl bg-white text-neutral-900 font-semibold hover:bg-white/90 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {submitting ? <span className="inline-block w-4 h-4 rounded-full border-2 border-neutral-900/30 border-t-neutral-900 animate-spin" /> : null}
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    </KioskShell>
  )
}

