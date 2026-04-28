import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../../api/client'
import { useCustomerVerifySession } from '../../hooks/useCustomerVerifySession'
import CustomerLayout from './CustomerLayout'
import { getCustomerSession, isQuickBrowseSession, setCustomerSession, setQuickBrowseSession } from './customerSession'

const UNCATEGORIZED = 'Other'

function normalizeCategory(c) {
  const s = String(c == null ? '' : c).trim()
  return s || UNCATEGORIZED
}

function groupByCategory(dishes) {
  const m = new Map()
  for (const d of dishes) {
    const k = normalizeCategory(d.category)
    if (!m.has(k)) m.set(k, [])
    m.get(k).push(d)
  }
  const keys = [...m.keys()].sort((a, b) => {
    if (a === UNCATEGORIZED) return 1
    if (b === UNCATEGORIZED) return -1
    return a.localeCompare(b)
  })
  return keys.map((name) => ({ name, dishes: m.get(name) }))
}

export default function CustomerMenu() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [sessionRev, setSessionRev] = useState(0)
  const [sessionReady, setSessionReady] = useState(() => {
    if (typeof window === 'undefined') return true
    const qs = new URLSearchParams(window.location.search)
    return !(qs.get('flow') === 'quick' && qs.get('tableId'))
  })
  useCustomerVerifySession()
  const session = getCustomerSession()
  const quickBrowse = isQuickBrowseSession(session)
  const [menu, setMenu] = useState([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState({})
  const [ordering, setOrdering] = useState(false)
  const [checkoutConfirmOpen, setCheckoutConfirmOpen] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [detailName, setDetailName] = useState('')
  const [detailPhone, setDetailPhone] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [selectedDish, setSelectedDish] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const tid = searchParams.get('tableId')
    const flow = searchParams.get('flow')
    if (flow === 'quick' && tid) {
      const n = Number(tid)
      if (Number.isFinite(n) && n > 0) {
        setQuickBrowseSession(n)
        navigate('/customer/menu', { replace: true })
        setSessionRev((x) => x + 1)
      }
    }
    setSessionReady(true)
  }, [searchParams, navigate])

  useEffect(() => {
    if (!sessionReady) return
    const s = getCustomerSession()
    if (!s?.tableNo) {
      navigate('/customer/login', { replace: true })
      return
    }
    setLoading(true)
    api
      .get('/user/menu')
      .then((data) => setMenu(Array.isArray(data) ? data : data?.dishes || []))
      .catch((e) => {
        alert(e.message)
        setMenu([])
      })
      .finally(() => setLoading(false))
  }, [navigate, sessionReady, sessionRev])

  const searchLower = search.trim().toLowerCase()
  const filteredMenu = useMemo(() => {
    if (!searchLower) return menu
    return menu.filter((d) => String(d.name || '').toLowerCase().includes(searchLower))
  }, [menu, searchLower])

  const categories = useMemo(() => {
    const unique = new Set(
      menu.map((d) => String(d?.category == null || d.category === '' ? 'General' : d.category).trim() || 'General')
    )
    return ['All', ...Array.from(unique).sort((a, b) => a.localeCompare(b))]
  }, [menu])

  const menuForView = useMemo(() => {
    if (activeCategory === 'All') return filteredMenu
    return filteredMenu.filter(
      (d) => (String(d?.category == null || d.category === '' ? 'General' : d.category).trim() || 'General') === activeCategory
    )
  }, [activeCategory, filteredMenu])

  const grouped = useMemo(() => groupByCategory(menuForView), [menuForView])

  const selectedDishIds = useMemo(
    () => Object.entries(cart).filter(([, qty]) => qty > 0).flatMap(([id, qty]) => Array.from({ length: qty }, () => id)),
    [cart]
  )

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

  function scrollToSection(i) {
    const el = document.getElementById(`cust-cat-${i}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function submitOrderOnly() {
    const s = getCustomerSession()
    if (!s?.tableNo) throw new Error('Missing table.')
    if (selectedDishIds.length < 1) throw new Error('Please add at least one dish.')
    const orderRes = await api.post('/user/order', { tableNo: s.tableNo, dishes: selectedDishIds })
    const oid = orderRes?.orderId || orderRes?.order?._id
    if (!oid) throw new Error('No order id returned')
    await api.post('/user/pay', { orderId: oid })
    setCheckoutConfirmOpen(false)
    setDetailsModalOpen(false)
    navigate('/customer/track')
  }

  async function executePlaceOrder() {
    setOrdering(true)
    try {
      await submitOrderOnly()
    } catch (e) {
      alert(e.message)
    } finally {
      setOrdering(false)
    }
  }

  function proceedAfterOrderReview() {
    if (isQuickBrowseSession(getCustomerSession())) {
      setCheckoutConfirmOpen(false)
      setDetailsModalOpen(true)
      return
    }
    executePlaceOrder()
  }

  async function submitDetailsAndPlaceOrder() {
    const s = getCustomerSession()
    const digits = String(detailPhone || '').replace(/\D/g, '').slice(0, 10)
    if (!detailName.trim()) {
      alert('Please enter your name.')
      return
    }
    if (digits && !/^\d{10}$/.test(digits)) {
      alert('Phone number must be exactly 10 digits (or leave it blank).')
      return
    }
    if (!s?.tableNo) return
    setOrdering(true)
    try {
      const result = await api.post('/user/login-table', {
        tableNo: s.tableNo,
        name: detailName.trim(),
        phoneNo: digits,
      })
      const u = result?.user
      setCustomerSession({
        tableNo: s.tableNo,
        name: u?.name || detailName.trim(),
        phoneNo: u?.phoneNo || digits,
        userId: u?._id != null ? String(u._id) : '',
        flow: 'standard',
        resumePath: '/customer/menu',
      })
      setSessionRev((x) => x + 1)
      await submitOrderOnly()
    } catch (e) {
      alert(e.message)
    } finally {
      setOrdering(false)
    }
  }

  if (!sessionReady) {
    return (
      <CustomerLayout title="Menu">
        <p className="text-sm text-gray-500 py-8 text-center">Loading…</p>
      </CustomerLayout>
    )
  }

  if (!session?.tableNo) {
    return null
  }

  return (
    <CustomerLayout title="Menu">
      <div className="mx-auto w-full max-w-lg space-y-4 pb-24">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Table #{session?.tableNo}</p>
            <h2 className="text-xl font-bold text-gray-900">Dishes</h2>
            {quickBrowse ? (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5 mt-2">
                Quick order: we will ask for your name and phone when you confirm your order.
              </p>
            ) : null}
            {!loading && (
              <p className="text-xs text-gray-500 mt-0.5">
                {menuForView.length} item{menuForView.length === 1 ? '' : 's'}
                {searchLower ? ' matching' : ''}
              </p>
            )}
          </div>
          {!quickBrowse ? (
            <button
              type="button"
              onClick={() => navigate('/customer/track')}
              className="w-9 h-9 rounded-full border border-gray-300 bg-white text-sm"
              aria-label="Track orders"
            >
              🧾
            </button>
          ) : null}
        </div>

        <div>
          <label className="sr-only" htmlFor="cust-menu-search">
            Search menu
          </label>
          <div className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 flex items-center gap-2">
            <span className="text-sm text-gray-400" aria-hidden>
              🔍
            </span>
            <input
              id="cust-menu-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name…"
              className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500 py-4">Loading menu…</p>
        ) : (
          <>
            <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1 md:overflow-x-visible md:[scrollbar-width:auto] md:[&::-webkit-scrollbar]:hidden">
              <div className="flex min-w-max gap-2 pb-1 md:min-w-0 md:flex-wrap">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => {
                      setActiveCategory(category)
                    }}
                    className={`shrink-0 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
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

            {activeCategory === 'All' && grouped.length > 0 && (
              <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:thin] md:overflow-x-visible md:[scrollbar-width:auto] md:[&::-webkit-scrollbar]:hidden">
                <div className="flex min-w-max gap-2 pb-1 text-xs text-gray-600 md:min-w-0 md:flex-wrap">
                  {grouped.map((g, i) => (
                    <button
                      type="button"
                      key={g.name}
                      onClick={() => scrollToSection(i)}
                      className="shrink-0 rounded-full border border-dashed border-gray-300 bg-gray-50 px-3 py-1 hover:bg-gray-100"
                    >
                      {g.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-dashed border-amber-200/80 bg-amber-50/80 p-3 flex items-center justify-between gap-2">
              <p className="text-xs sm:text-sm font-medium text-amber-950/90">
                <span className="md:hidden">Swipe each row sideways for more items in a category</span>
                <span className="hidden md:inline">Use the category chips above to jump between sections.</span>
              </p>
              <span className="text-base shrink-0 md:hidden" aria-hidden>
                ↔
              </span>
            </div>

            {menuForView.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-6">
                {search.trim() ? 'No dishes match your search.' : 'No dishes in this category yet.'}
              </p>
            ) : activeCategory === 'All' && grouped.length > 1 ? (
              <div className="space-y-8">
                {grouped.map((group, i) => (
                  <section key={group.name} id={`cust-cat-${i}`} className="scroll-mt-24">
                    <div className="flex items-baseline justify-between mb-2">
                      <h3 className="text-sm font-bold text-gray-900">{group.name}</h3>
                      <span className="text-xs text-gray-500">{group.dishes.length} items</span>
                    </div>
                    <div className="-mx-1 overflow-x-auto overflow-y-hidden px-1 pb-2 scroll-smooth snap-x snap-mandatory [scrollbar-width:thin] md:mx-0 md:overflow-x-visible md:overflow-y-visible md:px-0 md:pb-0 md:snap-none md:[scrollbar-width:auto] md:[&::-webkit-scrollbar]:hidden">
                      <ul className="flex w-max gap-3 pr-1 md:grid md:w-full md:max-w-none md:grid-cols-2 md:gap-4 lg:grid-cols-3 md:pr-0">
                        {group.dishes.map((dish) => (
                          <li key={dish._id} className="w-40 shrink-0 snap-start sm:w-44 md:w-auto md:min-w-0">
                            <DishRowCard
                              dish={dish}
                              cart={cart}
                              onOpen={() => setSelectedDish(dish)}
                              onChangeQty={changeQty}
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {menuForView.map((dish) => (
                  <div
                    key={dish._id}
                    onClick={() => setSelectedDish(dish)}
                    onKeyDown={(e) => e.key === 'Enter' && setSelectedDish(dish)}
                    role="button"
                    tabIndex={0}
                    className="bg-white border border-gray-200 rounded-2xl p-2.5 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  >
                    <div className="flex gap-3">
                      {dish.imageUrl ? (
                        <img src={dish.imageUrl} alt="" className="w-20 h-20 object-cover rounded-xl" />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                          No image
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{dish.name}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{dish.recipe || 'Freshly prepared'}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-900">Rs {dish.price}</p>
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className="w-7 h-7 rounded-lg bg-gray-100 text-sm"
                              onClick={() => changeQty(dish._id, -1)}
                            >
                              -
                            </button>
                            <span className="text-sm font-medium w-5 text-center">{cart[dish._id] || 0}</span>
                            <button
                              type="button"
                              className="w-7 h-7 rounded-lg bg-gray-900 text-white text-sm"
                              onClick={() => changeQty(dish._id, 1)}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {checkoutConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !ordering && setCheckoutConfirmOpen(false)} role="presentation" />
          <div className="relative w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-xl p-5">
            <h2 className="text-lg font-bold text-gray-900">Confirm your order</h2>
            <p className="text-sm text-gray-500 mt-1">Table #{session?.tableNo}</p>
            <ul className="mt-4 max-h-48 overflow-auto space-y-2 text-sm">
              {menu
                .filter((d) => (cart[d._id] || 0) > 0)
                .map((d) => (
                  <li key={d._id} className="flex justify-between gap-2 border-b border-gray-100 pb-2">
                    <span className="font-medium truncate">{d.name}</span>
                    <span className="text-gray-600 shrink-0">
                      ×{cart[d._id]} · Rs {Math.round((cart[d._id] || 0) * (Number(d.price) || 0))}
                    </span>
                  </li>
                ))}
            </ul>
            <p className="mt-3 text-sm font-semibold text-gray-900">Total: Rs {Math.round(cartTotal)}</p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                disabled={ordering}
                onClick={() => setCheckoutConfirmOpen(false)}
                className="flex-1 py-2.5 text-sm border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                disabled={ordering}
                onClick={proceedAfterOrderReview}
                className="flex-1 py-2.5 text-sm bg-gray-900 text-white rounded-xl disabled:opacity-50"
              >
                {ordering ? 'Placing…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailsModalOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !ordering && setDetailsModalOpen(false)} role="presentation" />
          <div className="relative w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-xl p-5">
            <h2 className="text-lg font-bold text-gray-900">Your details</h2>
            <p className="text-sm text-gray-500 mt-1">Table #{session?.tableNo} — required to place this order.</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Name</label>
                <input
                  value={detailName}
                  onChange={(e) => setDetailName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Phone (10 digits)</label>
                <input
                  value={detailPhone}
                  onChange={(e) => setDetailPhone(String(e.target.value || '').replace(/\D/g, '').slice(0, 10))}
                  inputMode="numeric"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  autoComplete="tel"
                />
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                disabled={ordering}
                onClick={() => setDetailsModalOpen(false)}
                className="flex-1 py-2.5 text-sm border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                disabled={ordering}
                onClick={submitDetailsAndPlaceOrder}
                className="flex-1 py-2.5 text-sm bg-gray-900 text-white rounded-xl disabled:opacity-50"
              >
                {ordering ? 'Placing…' : 'Place order'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedDish && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedDish(null)} role="presentation" />
          <div className="relative w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            {selectedDish.imageUrl ? (
              <img src={selectedDish.imageUrl} alt="" className="w-full h-40 object-cover shrink-0" />
            ) : null}
            <div className="p-4 overflow-auto">
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
                  <button type="button" className="w-8 h-8 rounded-lg bg-gray-100" onClick={() => changeQty(selectedDish._id, -1)}>
                    -
                  </button>
                  <span className="w-8 text-center">{cart[selectedDish._id] || 0}</span>
                  <button type="button" className="w-8 h-8 rounded-lg bg-gray-900 text-white" onClick={() => changeQty(selectedDish._id, 1)}>
                    +
                  </button>
                </div>
                <button type="button" onClick={() => setSelectedDish(null)} className="px-3 py-2 text-sm border border-gray-300 rounded-lg">
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
            type="button"
            onClick={() => selectedDishIds.length && setCheckoutConfirmOpen(true)}
            disabled={ordering || selectedDishIds.length === 0}
            className="px-4 py-2 text-sm bg-gray-900 text-white rounded-xl disabled:opacity-50"
          >
            Confirm order
          </button>
        </div>
      </div>
    </CustomerLayout>
  )
}

function DishRowCard({ dish, cart, onOpen, onChangeQty }) {
  return (
    <div className="h-full text-left bg-white border border-gray-200 rounded-2xl p-2 flex flex-col">
      <button type="button" onClick={onOpen} className="w-full text-left grow flex flex-col">
        {dish.imageUrl ? (
          <img src={dish.imageUrl} alt="" className="w-full h-24 object-cover rounded-xl" />
        ) : (
          <div className="w-full h-24 rounded-xl bg-gray-100 flex items-center justify-center text-[10px] text-gray-500">No image</div>
        )}
        <p className="mt-2 text-xs font-semibold text-gray-900 line-clamp-2">{dish.name}</p>
        <p className="text-xs text-gray-500">Rs {dish.price}</p>
      </button>
      <div className="mt-2 flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="w-7 h-7 rounded-lg bg-gray-100 text-sm" onClick={() => onChangeQty(dish._id, -1)}>
          -
        </button>
        <span className="text-xs font-medium w-5 text-center">{cart[dish._id] || 0}</span>
        <button type="button" className="w-7 h-7 rounded-lg bg-gray-900 text-white text-sm" onClick={() => onChangeQty(dish._id, 1)}>
          +
        </button>
      </div>
    </div>
  )
}
