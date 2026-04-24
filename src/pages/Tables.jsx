import { useEffect, useState } from 'react'
import { api } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import AllergyBadge from '../components/AllergyBadge'
import { useAuth } from '../context/AuthContext'

export default function Tables() {
  const { user } = useAuth()
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/restaurant/tables')
      .then(setTables)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function markAvailable(tableNo) {
    try {
      await api.patch(`/restaurant/tables/${tableNo}/available`, {})
      setTables((prev) => prev.map((t) => (t.tableNo === tableNo ? { ...t, status: 'available', waiterRequested: false } : t)))
    } catch (e) {
      alert(e.message)
    }
  }

  if (loading) return <p className="p-6 text-gray-500">Loading...</p>
  if (error) return <p className="p-6 text-red-500">{error}</p>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Tables</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {tables.map(table => (
          <div
            key={table._id}
            className={`rounded-xl border-2 p-4 text-center ${
              table.status === 'occupied'
                ? 'border-red-200 bg-red-50'
                : table.status === 'cleaning'
                  ? 'border-orange-200 bg-orange-50'
                  : 'border-green-200 bg-green-50'
            }`}
          >
            <p className="text-2xl font-bold text-gray-800 mb-2">#{table.tableNo}</p>
            <StatusBadge status={table.status} />
            {table.waiterRequested && <p className="text-xs text-red-600 mt-2 font-medium">Waiter requested</p>}
            {table.allergyAlert && (
              <div className="mt-2">
                <AllergyBadge />
              </div>
            )}
            {user && table.status !== 'available' && (
              <button
                onClick={() => markAvailable(table.tableNo)}
                className="mt-3 text-xs text-blue-700 hover:underline"
              >
                Mark Available
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
