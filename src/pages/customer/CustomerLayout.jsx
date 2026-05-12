import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import { onCustomerFlowEnter } from '../../utils/sessionCoordination'
import { clearCustomerSession, getCustomerSession } from './customerSession'

/* ─── Waiter Toast ────────────────────────────────────────────────── */
function WaiterToast({ visible }) {
  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-end justify-center pb-36 px-4
        pointer-events-none
        transition-all duration-300
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
    >
      <div className="pointer-events-auto flex items-center gap-3 bg-gray-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl">
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 shrink-0">
          <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" strokeWidth={2.5} stroke="white">
            <path d="M4 10l4.5 4.5L16 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div>
          <p className="text-sm font-semibold leading-tight">Waiter on the way!</p>
          <p className="text-xs text-gray-400 mt-0.5">Someone will be with you shortly.</p>
        </div>
      </div>
    </div>
  )
}

/* ─── Waiter FAB ──────────────────────────────────────────────────── */
function WaiterFAB({ onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      aria-label="Call waiter"
      className={`
        fixed bottom-24 right-4 z-20
        flex flex-col items-center justify-center
        w-20 h-20 rounded-full
        shadow-xl overflow-hidden
        transition-all duration-200 active:scale-95
        ${loading
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:scale-105'}
      `}
    >
      <img
        src="https://static.vecteezy.com/system/resources/thumbnails/007/270/730/small/the-waiter-restaurant-resto-food-court-cafe-logo-template-design-element-for-logo-poster-card-banner-emblem-t-shirt-illustration-vector.jpg"
        alt="Call Waiter"
        className="w-full h-full object-cover"
      />
    </button>
  )
}

/* ─── Layout ──────────────────────────────────────────────────────── */
import { usePopup } from '../../context/PopupContext'

export default function CustomerLayout({ title, children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const session = getCustomerSession()
  const onTrack = location.pathname === '/customer/track'

  const [loading, setLoading] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)

  useEffect(() => {
    if (session?.tableNo) onCustomerFlowEnter()
  }, [session?.tableNo])

  async function callWaiter() {
    if (!session?.tableNo || loading) return
    setLoading(true)
    try {
      await api.post('/user/call-waiter', { tableNo: session.tableNo })
      setToastVisible(true)
      setTimeout(() => setToastVisible(false), 3000)
    } catch (e) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  function exitSession() {
    // Do NOT clear the session — let Welcome check it on return.
    // If the order is still open, Welcome will resume back to the right page.
    navigate('/', { replace: true })
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-gray-900">{title}</p>
            <p className="text-xs text-gray-500">Table #{session?.tableNo || '-'}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onTrack ? (
              <button
                type="button"
                onClick={() => navigate('/customer/menu')}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
              >
                Back to menu
              </button>
            ) : null}
            <button type="button" onClick={exitSession} className="text-xs text-gray-500 hover:text-gray-800 px-2 py-1.5">
              Home
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl w-full mx-auto p-4 pb-32">{children}</main>

      <WaiterFAB onClick={callWaiter} loading={loading} />
      <WaiterToast visible={toastVisible} />
    </div>
  )
}