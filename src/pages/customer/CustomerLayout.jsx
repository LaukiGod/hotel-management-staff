import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import { clearCustomerSession, getCustomerSession } from './customerSession'

export default function CustomerLayout({ title, children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const session = getCustomerSession()
  const onTrack = location.pathname === '/customer/track'

  async function callWaiter() {
    if (!session?.tableNo) return
    try {
      await api.post('/user/call-waiter', { tableNo: session.tableNo })
      alert('Waiter has been notified.')
    } catch (e) {
      alert(e.message)
    }
  }

  function exitSession() {
    clearCustomerSession()
    navigate('/tables', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-100">
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
              Exit
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4">{children}</main>

      <button
        onClick={callWaiter}
        className="fixed bottom-5 right-5 bg-red-600 text-white px-4 py-2 rounded-full shadow-lg text-sm hover:bg-red-700"
      >
        Call Waiter
      </button>
    </div>
  )
}
