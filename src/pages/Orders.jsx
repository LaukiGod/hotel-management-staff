    import { useEffect, useState } from 'react'
import { api } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import AllergyBadge from '../components/AllergyBadge'

const STATUSES = ['created', 'paid', 'preparing', 'served', 'completed']

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    api.get('/restaurant/orders')
      .then(setOrders)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleStatusChange(orderId, status) {
    setUpdating(orderId)
    try {
      await api.post('/restaurant/order-status', { orderId, status })
      setOrders(prev =>
        prev.map(o => (o._id === orderId ? { ...o, status } : o))
      )
    } catch (e) {
      alert(e.message)
    } finally {
      setUpdating(null)
    }
  }

  if (loading) return <p className="p-6 text-gray-500">Loading...</p>
  if (error) return <p className="p-6 text-red-500">{error}</p>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Orders</h1>
      <div className="space-y-3">
        {orders.length === 0 && (
          <p className="text-gray-400">No orders yet.</p>
        )}
        {orders.map(order => (
          <div key={order._id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-800">Table #{order.tableNo}</span>
                  <StatusBadge status={order.status} />
                  {order.allergyAlert && <AllergyBadge />}
                </div>
                <p className="text-sm text-gray-500">
                  {order.dishes?.map(d => d.name).join(', ') || 'No dishes'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
              <select
                value={order.status}
                disabled={updating === order._id}
                onChange={e => handleStatusChange(order._id, e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {STATUSES.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
