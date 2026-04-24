import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../../api/client'
import { getCustomerSession, setCustomerSession } from './customerSession'

export default function CustomerLogin() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tableIdFromQR = searchParams.get('tableId') || ''
  const [name, setName] = useState('')
  const [phoneNo, setPhoneNo] = useState('')
  const [tableNo, setTableNo] = useState(tableIdFromQR)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const existing = getCustomerSession()
    if (existing?.tableNo) {
      navigate('/customer/menu', { replace: true })
    }
  }, [navigate])

  async function handleStart(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await api.post('/user/login-table', {
        tableNo: Number(tableNo),
        name,
        phoneNo
      })
      setCustomerSession({
        tableNo: Number(tableNo),
        name: result?.user?.name || name,
        phoneNo: result?.user?.phoneNo || phoneNo
      })
      navigate('/customer/menu')
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <form onSubmit={handleStart} className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900">Table Login</h1>
        <p className="text-sm text-gray-500 mt-1 mb-6">Scan QR and continue ordering.</p>

        <div className="space-y-3">
          <Input label="Table ID" value={tableNo} onChange={setTableNo} type="number" required />
          <Input label="Your Name" value={name} onChange={setName} required />
          <Input label="Phone Number" value={phoneNo} onChange={setPhoneNo} required />
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
