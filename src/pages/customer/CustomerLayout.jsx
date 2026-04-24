import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import { clearCustomerSession, getCustomerSession } from './customerSession'

export default function CustomerLayout({ title, children }) {
  const navigate = useNavigate()
  const session = getCustomerSession()

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
    navigate('/customer/login')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-gray-900">{title}</p>
            <p className="text-xs text-gray-500">Table #{session?.tableNo || '-'}</p>
          </div>
          <button onClick={exitSession} className="text-xs text-gray-500 hover:text-gray-800">
            Exit
          </button>
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
