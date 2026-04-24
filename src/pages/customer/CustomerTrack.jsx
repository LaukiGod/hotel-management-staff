import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import CustomerLayout from './CustomerLayout'
import { clearCustomerSession, getCustomerSession } from './customerSession'

export default function CustomerTrack() {
  const navigate = useNavigate()
  const session = getCustomerSession()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  async function loadOrders() {
    if (!session?.tableNo) return
    try {
      const data = await api.get(`/user/orders/${session.tableNo}`)
      setOrders(data)
    } catch (e) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!session?.tableNo) {
      navigate('/customer/login', { replace: true })
      return
    }
    loadOrders()
    const t = setInterval(loadOrders, 10000)
    return () => clearInterval(t)
  }, [navigate, session?.tableNo])

  const latestOrder = useMemo(() => orders[0], [orders])

  async function markMealComplete() {
    try {
      await api.post('/user/meal-complete', { tableNo: session.tableNo })
      await loadOrders()
      alert('Meal marked complete.')
    } catch (e) {
      alert(e.message)
    }
  }

  async function submitReview() {
    if (!latestOrder?._id) return
    try {
      await api.post('/user/review', { orderId: latestOrder._id, rating, comment })
      alert('Review submitted.')
    } catch (e) {
      alert(e.message)
    }
  }

  async function exitTable() {
    try {
      await api.post('/user/clear-table', { tableNo: session.tableNo })
      clearCustomerSession()
      navigate('/customer/login')
    } catch (e) {
      alert(e.message)
    }
  }

  if (loading) {
    return (
      <CustomerLayout title="Track Order">
        <p className="text-sm text-gray-500">Loading...</p>
      </CustomerLayout>
    )
  }

  return (
    <CustomerLayout title="Track Order">
      <div className="space-y-3">
        {orders.map((order) => (
          <div key={order._id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-gray-800">Order #{order._id.slice(-6)}</p>
              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 capitalize">{order.status}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {order.dishes?.map((d) => d.name).join(', ') || 'No items'}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex gap-2 flex-wrap">
        <button onClick={() => navigate('/customer/menu')} className="px-3 py-2 text-sm border border-gray-300 rounded-lg">
          Add More Items
        </button>
        <button onClick={markMealComplete} className="px-3 py-2 text-sm bg-gray-900 text-white rounded-lg">
          Mark Meal Completed
        </button>
      </div>

      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4">
        <p className="font-medium text-gray-800 mb-2">Leave a Review</p>
        <div className="flex items-center gap-3">
          <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="border border-gray-300 rounded-lg px-2 py-1 text-sm">
            {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} Star</option>)}
          </select>
          <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Comment" className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
          <button onClick={submitReview} className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg">Submit</button>
        </div>
      </div>

      <button onClick={exitTable} className="mt-6 text-sm text-gray-500 hover:text-gray-800">
        Exit Table Session
      </button>
    </CustomerLayout>
  )
}
