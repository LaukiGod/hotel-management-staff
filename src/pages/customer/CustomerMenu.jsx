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
  const [activeCategory, setActiveCategory] = useState('All')
  const [selectedDish, setSelectedDish] = useState(null)

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

  const categories = useMemo(() => {
    const unique = new Set(menu.map((dish) => String(dish.category || 'General').trim() || 'General'))
    return ['All', ...Array.from(unique)]
  }, [menu])

  const visibleMenu = useMemo(() => {
    if (activeCategory === 'All') return menu
    return menu.filter((dish) => (String(dish.category || 'General').trim() || 'General') === activeCategory)
  }, [menu, activeCategory])

  const featuredItems = useMemo(() => visibleMenu.slice(0, 6), [visibleMenu])
  const listItems = useMemo(() => visibleMenu.slice(6), [visibleMenu])
  const cartTotal = useMemo(
    () => menu.reduce((sum, dish) => sum + ((cart[dish._id] || 0) * (Number(dish.price) || 0)), 0),
    [cart, menu]
  )

  function changeQty(dishId, delta) {
    setCart((prev) => {
      const next = Math.max((prev[dishId] || 0) + delta, 0)
      return { ...prev, [dishId]: next }
    })
  }

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
      <div className="mx-auto w-full max-w-md space-y-4 pb-24">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Table #{session?.tableNo}</p>
            <h2 className="text-xl font-bold text-gray-900">Dishes</h2>
          </div>
          <button
            onClick={() => navigate('/customer/track')}
            className="w-9 h-9 rounded-full border border-gray-300 bg-white text-sm"
            aria-label="Track orders"
          >
            🧾
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 flex items-center gap-2">
          <span className="text-sm text-gray-400">🔍</span>
          <input
            readOnly
            value="Search menu"
            className="w-full bg-transparent text-sm text-gray-500 outline-none"
          />
        </div>

        <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-2 min-w-max">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                  activeCategory === category
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Special offer</p>
            <p className="text-sm font-semibold text-gray-900">Get extra discounts on combos</p>
          </div>
          <span className="text-lg">🎁</span>
        </div>

        <section>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-900">Popular choices</p>
          </div>
          <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-3 min-w-max">
              {featuredItems.map((dish) => (
                <button
                  key={dish._id}
                  onClick={() => setSelectedDish(dish)}
                  className="w-36 text-left bg-white border border-gray-200 rounded-2xl p-2 shrink-0"
                >
                  {dish.imageUrl ? (
                    <img src={dish.imageUrl} alt={dish.name} className="w-full h-20 object-cover rounded-xl" />
                  ) : (
                    <div className="w-full h-20 rounded-xl bg-gray-100 flex items-center justify-center text-xs text-gray-500">No image</div>
                  )}
                  <p className="mt-2 text-xs font-semibold text-gray-900 truncate">{dish.name}</p>
                  <p className="text-xs text-gray-500">Rs {dish.price}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <p className="text-sm font-semibold text-gray-900">Menu list</p>
          {(listItems.length ? listItems : featuredItems).map((dish) => (
            <div key={dish._id} onClick={() => setSelectedDish(dish)} className="bg-white border border-gray-200 rounded-2xl p-2.5">
              <div className="flex gap-3">
                {dish.imageUrl ? (
                  <img src={dish.imageUrl} alt={dish.name} className="w-20 h-20 object-cover rounded-xl" />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center text-xs text-gray-500">No image</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{dish.name}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{dish.recipe || 'Freshly prepared'}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">Rs {dish.price}</p>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button className="w-7 h-7 rounded-lg bg-gray-100 text-sm" onClick={() => changeQty(dish._id, -1)}>-</button>
                      <span className="text-sm font-medium w-5 text-center">{cart[dish._id] || 0}</span>
                      <button className="w-7 h-7 rounded-lg bg-gray-900 text-white text-sm" onClick={() => changeQty(dish._id, 1)}>+</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>

      {selectedDish && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedDish(null)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
            {selectedDish.imageUrl ? (
              <img src={selectedDish.imageUrl} alt={selectedDish.name} className="w-full h-40 object-cover" />
            ) : null}
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold text-gray-900">{selectedDish.name}</p>
                  <p className="text-sm text-gray-600">{selectedDish.category || 'General'}</p>
                </div>
                <p className="text-base font-semibold text-gray-900">Rs {selectedDish.price}</p>
              </div>
              <p className="text-sm text-gray-600 mt-3">{selectedDish.recipe || 'Freshly prepared for your table.'}</p>
              {selectedDish.ingredients?.length ? (
                <p className="text-xs text-gray-500 mt-2">Ingredients: {selectedDish.ingredients.join(', ')}</p>
              ) : null}

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button className="w-8 h-8 rounded-lg bg-gray-100" onClick={() => changeQty(selectedDish._id, -1)}>-</button>
                  <span className="w-8 text-center">{cart[selectedDish._id] || 0}</span>
                  <button className="w-8 h-8 rounded-lg bg-gray-900 text-white" onClick={() => changeQty(selectedDish._id, 1)}>+</button>
                </div>
                <button onClick={() => setSelectedDish(null)} className="px-3 py-2 text-sm border border-gray-300 rounded-lg">
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md bg-white border border-gray-200 rounded-2xl px-3 py-2.5 shadow-lg">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-gray-500">Items: {selectedDishIds.length}</p>
            <p className="text-sm font-semibold text-gray-900 truncate">Total: Rs {Math.round(cartTotal)}</p>
          </div>
          <button
            onClick={placeAndPay}
            disabled={ordering || selectedDishIds.length === 0}
            className="px-4 py-2 text-sm bg-gray-900 text-white rounded-xl disabled:opacity-50"
          >
            {ordering ? 'Processing...' : 'Checkout'}
          </button>
        </div>
      </div>
    </CustomerLayout>
  )
}
