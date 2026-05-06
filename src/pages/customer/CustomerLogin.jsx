import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { clearCustomerSession, getCustomerSession, isQuickBrowseSession, setCustomerSession } from './customerSession'
import { sessionMatchesTableUser, tableHasOpenCustomerTicket } from './customerOrderUtils'

export default function CustomerLogin() {
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const tableIdFromQR = searchParams.get('tableId') || ''
  const [name, setName] = useState('')
  const [phoneNo, setPhoneNo] = useState('')
  const [tableNo, setTableNo] = useState(tableIdFromQR)
  const [loading, setLoading] = useState(false)
  const [restoring, setRestoring] = useState(() => Boolean(getCustomerSession()?.tableNo))

  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      const existing = getCustomerSession()
      if (!existing?.tableNo) {
        setRestoring(false)
        return
      }
      if (isQuickBrowseSession(existing)) {
        if (!cancelled) navigate('/customer/menu', { replace: true })
        setRestoring(false)
        return
      }
      try {
        const ts = await api.get(`/user/table-session/${existing.tableNo}`)
        if (cancelled) return
        if (!ts?.valid || !sessionMatchesTableUser(existing, ts)) {
          clearCustomerSession()
          return
        }
        const orders = await api.get(`/user/orders/${existing.tableNo}`)
        let path = existing.resumePath
        if (path !== '/customer/menu' && path !== '/customer/track') path = null
        if (!path) {
          path = tableHasOpenCustomerTicket(orders) ? '/customer/track' : '/customer/menu'
        } else if (path === '/customer/track' && !tableHasOpenCustomerTicket(orders)) {
          path = '/customer/menu'
        }
        navigate(path, { replace: true })
      } catch {
        if (!cancelled) clearCustomerSession()
      } finally {
        if (!cancelled) setRestoring(false)
      }
    }

    restoreSession()
    return () => {
      cancelled = true
    }
  }, [navigate])

  async function handleStart(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await api.post('/user/login-table', {
        tableNo: Number(tableNo),
        name,
        phoneNo: String(phoneNo || '').replace(/\D/g, '').slice(0, 10)
      })
      const u = result?.user
      setCustomerSession({
        tableNo: Number(tableNo),
        name: u?.name || name,
        phoneNo: u?.phoneNo || String(phoneNo || '').replace(/\D/g, '').slice(0, 10),
        userId: u?._id != null ? String(u._id) : '',
        flow: 'standard',
        resumePath: '/customer/menu'
      })
      navigate('/customer/menu')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (restoring) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <p className="text-sm text-white/80">Restoring your table session…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <form onSubmit={handleStart} className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900">Table Login</h1>
        <p className="text-sm text-gray-500 mt-1 mb-6">Scan QR and continue ordering.</p>

        <div className="space-y-3">
          <Input label="Table ID" value={tableNo} onChange={setTableNo} type="number" required />
          <Input label="Your Name" value={name} onChange={setName} required />
          <Input label="Phone Number (optional)" value={phoneNo} onChange={setPhoneNo} />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 bg-gray-900 text-white rounded-lg py-2.5 text-sm hover:bg-gray-700 disabled:opacity-50"
        >
          {loading ? 'Starting...' : 'Start Ordering'}
        </button>
      </form>
    </div>
  )
}

function Input({ label, value, onChange, type = 'text', required }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        required={required}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
      />
    </div>
  )
}
