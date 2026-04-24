import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import CustomerLayout from './CustomerLayout'
import { getCustomerSession } from './customerSession'

export default function CustomerMenu() {
  const navigate = useNavigate()
  const session = getCustomerSession()
  const [menu, setMenu] = useState([])
  const [cart, setCart] = useState({})
  const [ordering, setOrdering] = useState(false)

  useEffect(() => {
    if (!session?.tableNo) {
      navigate('/customer/login', { replace: true })
      return
    }
    api.get('/user/menu').then(setMenu).catch((e) => alert(e.message))
  }, [navigate, session?.tableNo])

  const selectedDishIds = useMemo(
    () => Object.entries(cart).filter(([, qty]) => qty > 0).flatMap(([id, qty]) => Array.from({ length: qty }, () => id)),
    [cart]
  )

  async function placeAndPay() {
    if (!selectedDishIds.length) return
    setOrdering(true)
    try {
      const orderRes = await api.post('/user/order', { tableNo: session.tableNo, dishes: selectedDishIds })
      await api.post('/user/pay', { orderId: orderRes.order._id, upiReference: `UPI-${Date.now()}` })
      navigate('/customer/track')
    } catch (e) {
      alert(e.message)
    } finally {
      setOrdering(false)
    }
  }

  return (
    <CustomerLayout title="Menu">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {menu.map((dish) => (
          <div key={dish._id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900">{dish.name}</p>
                <p className="text-xs text-gray-500 mt-1">{dish.recipe || 'Freshly prepared'}</p>
                <p className="text-sm font-medium text-gray-800 mt-2">Rs {dish.price}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="w-7 h-7 rounded bg-gray-100" onClick={() => setCart((c) => ({ ...c, [dish._id]: Math.max((c[dish._id] || 0) - 1, 0) }))}>-</button>
                <span className="text-sm w-6 text-center">{cart[dish._id] || 0}</span>
                <button className="w-7 h-7 rounded bg-gray-100" onClick={() => setCart((c) => ({ ...c, [dish._id]: (c[dish._id] || 0) + 1 }))}>+</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
        <p className="text-sm text-gray-700">Items selected: {selectedDishIds.length}</p>
        <div className="flex gap-2">
          <button onClick={() => navigate('/customer/track')} className="px-3 py-2 text-sm border border-gray-300 rounded-lg">
            Track Orders
          </button>
          <button
            onClick={placeAndPay}
            disabled={ordering || selectedDishIds.length === 0}
            className="px-3 py-2 text-sm bg-gray-900 text-white rounded-lg disabled:opacity-50"
          >
            {ordering ? 'Processing...' : 'Place & Pay via UPI'}
          </button>
        </div>
      </div>
    </CustomerLayout>
  )
}
