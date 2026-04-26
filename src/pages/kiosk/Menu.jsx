import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { kioskAxios } from '../../api/kioskAxios'
import KioskShell from '../../components/KioskShell'
import KioskBackButton from '../../components/KioskBackButton'
import { useKioskSession } from '../../context/KioskSessionContext'

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

export default function KioskMenu() {
  const navigate = useNavigate()
  const { tableNo, user, cart, setQty, allergies, setAllergies, setOrderId } = useKioskSession()
  const [dishes, setDishes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [search, setSearch] = useState('')
  const [focusCategory, setFocusCategory] = useState(null)
  const chipRowRef = useRef(null)

  const scrollCatIntoView = useCallback((nameOrIndex) => {
    if (nameOrIndex === '__top__' || nameOrIndex === 'all') {
      document.getElementById('kiosk-menu-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    if (typeof nameOrIndex === 'number') {
      document.getElementById(`kiosk-cat-section-${nameOrIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  useEffect(() => {
    if (!tableNo || !user) {
      navigate('/tables', { replace: true })
      return
    }
    let mounted = true
    kioskAxios
      .get('/user/menu')
      .then((r) => {
        if (!mounted) return
        setDishes(Array.isArray(r.data) ? r.data : r.data?.dishes || [])
      })
      .catch((e) => setError(e?.response?.data?.message || e.message || 'Failed to load dishes'))
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [navigate, tableNo, user])

  const searchLower = search.trim().toLowerCase()
  const filtered = useMemo(() => {
    if (!searchLower) return dishes
    return dishes.filter((d) => String(d.name || '').toLowerCase().includes(searchLower))
  }, [dishes, searchLower])

  const grouped = useMemo(() => groupByCategory(filtered), [filtered])
  const categoryNames = useMemo(() => grouped.map((g) => g.name), [grouped])

  const cartCount = useMemo(() => cart.reduce((sum, i) => sum + (Number(i.qty) || 0), 0), [cart])
  const total = useMemo(
    () => cart.reduce((sum, i) => sum + (Number(i.qty) || 0) * (Number(i.dish?.price) || 0), 0),
    [cart]
  )
  const dishIdsExpanded = useMemo(() => {
    return cart.flatMap((i) => {
      const id = i.dish?.dishId || i.dish?._id
      const qty = Number(i.qty) || 0
      return id ? Array.from({ length: qty }, () => id) : []
    })
  }, [cart])

  useEffect(() => {
    if (!categoryNames.length) return
    if (focusCategory == null) setFocusCategory('__all__')
  }, [categoryNames, focusCategory])

  function getQty(dish) {
    const idKey = dish.dishId || dish._id
    const inCart = cart.find((i) => (i.dish?.dishId || i.dish?._id) === idKey)
    return inCart?.qty || 0
  }

  function openOrderConfirm() {
    if (!dishIdsExpanded.length) return
    setConfirmOpen(true)
  }

  async function submitConfirmedOrder() {
    if (!dishIdsExpanded.length || placing) return
    setPlacing(true)
    try {
      const res = await kioskAxios.post('/user/order', { tableNo: Number(tableNo), dishes: dishIdsExpanded })
      const id = res.data?.orderId || res.data?.order?._id
      if (!id) throw new Error('Order placed, but no orderId returned')
      await kioskAxios.post('/user/pay', { orderId: id })
      setOrderId(String(id))
      setDrawerOpen(false)
      setConfirmOpen(false)
      navigate('/order-tracking')
    } catch (e) {
      alert(e?.response?.data?.message || e.message || 'Failed to confirm order')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <KioskShell className="relative">
      <div id="kiosk-menu-top" className="px-4 sm:px-5 pt-6 sm:pt-8 pb-6 max-w-[1600px] mx-auto">
        <div className="mb-3">
          <KioskBackButton
            onBack={() => navigate('/register', { replace: true, state: { from: '/menu' } })}
          >
            Your details
          </KioskBackButton>
          <div className="mt-3">
            <p className="text-white/70 text-sm">Step 3 of 5</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold mt-1 leading-none tracking-tight">Menu</h1>
            <p className="mt-2 text-lg sm:text-2xl leading-none text-white/70">
              Table #{tableNo}
              {dishes.length > 0 ? (
                <span className="text-white/50 text-base sm:text-lg font-normal"> · {filtered.length} items</span>
              ) : null}
            </p>
          </div>
          <button
            onClick={() => navigate('/register', { state: { from: '/menu' } })}
            className="text-sm sm:text-xl leading-none text-white/70 hover:text-white transition-colors"
          >
            Edit details
          </button>
        </div>

        {loading ? <p className="mt-4 text-white/60">Loading dishes…</p> : null}
        {error ? <p className="mt-4 text-red-300">{error}</p> : null}

        {!loading && !error && (
          <div className="mt-4 space-y-4">
            <div>
              <label className="sr-only" htmlFor="kiosk-menu-search">
                Search menu
              </label>
              <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-3 py-2.5 sm:py-3">
                <span className="text-white/50 text-lg" aria-hidden>
                  🔍
                </span>
                <input
                  id="kiosk-menu-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by dish name…"
                  className="w-full min-w-0 bg-transparent text-sm sm:text-base text-white placeholder:text-white/40 outline-none"
                />
              </div>
            </div>

            {grouped.length === 0 ? (
              <p className="text-white/60 py-6 text-center">
                {search.trim() ? 'No dishes match your search.' : 'No dishes in the menu yet.'}
              </p>
            ) : (
              <div
                className="sticky top-0 z-30 -mx-4 sm:-mx-5 px-4 sm:px-5 py-2 bg-neutral-950/90 backdrop-blur-md border-b border-white/5"
                style={{ top: 0 }}
              >
                <p className="text-xs text-white/50 uppercase tracking-wider mb-1.5">Categories</p>
                <div
                  ref={chipRowRef}
                  className="flex gap-2 overflow-x-auto overflow-y-hidden pb-0.5 -mx-0.5 px-0.5 scroll-smooth [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setFocusCategory('__all__')
                      scrollCatIntoView('__top__')
                    }}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold border transition-colors ${
                      focusCategory === '__all__'
                        ? 'bg-white text-neutral-900 border-white'
                        : 'bg-white/5 text-white/90 border-white/15 hover:bg-white/10'
                    }`}
                  >
                    All
                  </button>
                  {categoryNames.map((name, idx) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setFocusCategory(name)
                        scrollCatIntoView(idx)
                      }}
                      className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium border max-w-[min(200px,70vw)] truncate transition-colors ${
                        focusCategory === name
                          ? 'bg-amber-500/90 text-neutral-900 border-amber-400/80'
                          : 'bg-white/5 text-white/90 border-white/15 hover:bg-white/10'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-8 pb-28">
              {grouped.map(({ name, dishes: row }, idx) => {
                return (
                  <section
                    key={name}
                    id={`kiosk-cat-section-${idx}`}
                    className="scroll-mt-32"
                    aria-label={name}
                  >
                    <div className="flex items-baseline justify-between gap-2 mb-3">
                      <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">{name}</h2>
                      <span className="text-sm text-white/50">{row.length} items</span>
                    </div>
                    <div className="overflow-x-auto overflow-y-hidden -mx-4 sm:-mx-5 px-4 sm:px-5 pb-1 scroll-smooth snap-x snap-mandatory [scrollbar-width:thin]">
                      <ul className="flex gap-3 w-max pr-1">
                        {row.map((dish) => {
                          const idKey = dish.dishId || dish._id
                          const qty = getQty(dish)
                          const ingredients = Array.isArray(dish.ingredients) ? dish.ingredients.slice(0, 3).join(', ') : ''
                          return (
                            <li key={idKey} className="snap-start shrink-0 w-[40vw] min-w-[156px] max-w-[200px] sm:min-w-[180px] sm:max-w-[220px]">
                              <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                className="h-full rounded-2xl overflow-hidden border border-white/10 bg-neutral-900/95 flex flex-col"
                              >
                                <div className="h-28 sm:h-32 lg:h-36 bg-white/5 shrink-0">
                                  {dish.imageUrl ? (
                                    <img
                                      src={dish.imageUrl}
                                      alt={dish.name}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="h-full w-full bg-gradient-to-br from-amber-500/15 to-white/5 flex items-end justify-end p-2">
                                      <span className="text-[10px] text-white/40 font-medium">No image</span>
                                    </div>
                                  )}
                                </div>
                                <div className="p-3 flex flex-col flex-1 min-h-0">
                                  <p className="text-sm sm:text-base font-bold leading-tight line-clamp-2">{dish.name}</p>
                                  <p className="text-xs text-white/55 line-clamp-1 mt-0.5 min-h-4">{ingredients || '\u00a0'}</p>
                                  <p className="text-base sm:text-lg font-extrabold mt-auto pt-2">₹{dish.price}</p>
                                  <div className="mt-2 h-10 sm:h-10 rounded-xl border border-white/15 bg-black/35 flex items-center justify-between px-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setQty(dish, Math.max(0, qty - 1))}
                                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/10 hover:bg-white/15 transition text-xl leading-none"
                                    >
                                      −
                                    </button>
                                    <p className="font-extrabold text-lg sm:text-xl leading-none">{qty}</p>
                                    <button
                                      type="button"
                                      onClick={() => setQty(dish, qty + 1)}
                                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/10 hover:bg-white/15 transition text-xl leading-none"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  </section>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-4 sm:bottom-6 right-4 sm:right-5 z-40 h-12 sm:h-14 px-4 sm:px-5 rounded-2xl bg-white text-neutral-900 font-extrabold shadow-xl hover:bg-white/90 transition flex items-center gap-2 sm:gap-3"
      >
        <span className="text-base sm:text-xl">Cart</span>
        <span className="min-w-7 h-7 sm:min-w-8 sm:h-8 px-2 rounded-xl bg-neutral-900 text-white flex items-center justify-center text-sm sm:text-lg">
          {cartCount}
        </span>
      </button>

      <AnimatePresence>
        {drawerOpen ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/70" onClick={() => setDrawerOpen(false)} role="presentation" />
            <motion.div
              className="relative w-full max-w-3xl rounded-t-3xl border border-white/10 bg-neutral-950 p-6 pb-8"
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 40 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold">Your cart</h2>
                <button
                  type="button"
                  className="text-sm text-white/70 hover:text-white"
                  onClick={() => setDrawerOpen(false)}
                >
                  Close
                </button>
              </div>

              <div className="mt-5 space-y-3 max-h-[45vh] overflow-auto pr-1">
                {cart.length ? (
                  cart.map((i) => {
                    const idKey = i.dish?.dishId || i.dish?._id
                    const qty = Number(i.qty) || 0
                    return (
                      <div
                        key={idKey}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{i.dish?.name}</p>
                          <p className="text-xs text-white/60 mt-1">₹{i.dish?.price} each</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setQty(i.dish, qty - 1)}
                            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/15 transition text-xl"
                          >
                            −
                          </button>
                          <span className="w-10 text-center font-extrabold">{qty}</span>
                          <button
                            type="button"
                            onClick={() => setQty(i.dish, qty + 1)}
                            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/15 transition text-xl"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-white/60">Your cart is empty. Add dishes from the menu.</p>
                )}
              </div>

              <div className="mt-6">
                <label className="block text-xs text-white/70 mb-2">Allergy notes (carried with order)</label>
                <input
                  value={(allergies || []).join(', ')}
                  onChange={(e) => {
                    const next = e.target.value
                      .split(',')
                      .map((s) => s.trim().toLowerCase())
                      .filter(Boolean)
                    setAllergies(Array.from(new Set(next)))
                  }}
                  placeholder="e.g. nuts, dairy"
                  className="w-full h-12 rounded-2xl bg-black/30 border border-white/10 px-4 text-sm outline-none focus:border-white/25"
                />
              </div>

              <div className="mt-6 flex items-center justify-between">
                <p className="text-white/70">Total</p>
                <p className="text-2xl font-extrabold">₹{Math.round(total)}</p>
              </div>

              <button
                type="button"
                onClick={openOrderConfirm}
                disabled={!cartCount || placing}
                className="mt-4 w-full h-14 rounded-2xl bg-white text-neutral-900 font-extrabold hover:bg-white/90 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                Confirm order
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {confirmOpen ? (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/80"
              onClick={() => !placing && setConfirmOpen(false)}
              role="presentation"
            />
            <motion.div
              className="relative w-full max-w-md rounded-3xl border border-white/15 bg-neutral-950 p-6 shadow-2xl"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-xl font-extrabold">Confirm your order</h2>
              <p className="mt-1 text-sm text-white/60">Table #{tableNo} · review items, then confirm.</p>

              <ul className="mt-5 max-h-[40vh] overflow-auto space-y-2 pr-1">
                {cart.map((i) => {
                  const idKey = i.dish?.dishId || i.dish?._id
                  const qty = Number(i.qty) || 0
                  return (
                    <li
                      key={idKey}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm"
                    >
                      <span className="font-medium truncate">{i.dish?.name}</span>
                      <span className="text-white/60 shrink-0">
                        ×{qty} · ₹{Math.round(qty * (Number(i.dish?.price) || 0))}
                      </span>
                    </li>
                  )
                })}
              </ul>

              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                <span className="text-white/70">Total</span>
                <span className="text-2xl font-extrabold">₹{Math.round(total)}</span>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  disabled={placing}
                  onClick={() => setConfirmOpen(false)}
                  className="flex-1 h-12 rounded-2xl border border-white/15 bg-white/5 font-semibold hover:bg-white/10 disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={placing}
                  onClick={submitConfirmedOrder}
                  className="flex-1 h-12 rounded-2xl bg-white text-neutral-900 font-extrabold hover:bg-white/90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {placing ? (
                    <span className="inline-block w-4 h-4 rounded-full border-2 border-neutral-900/30 border-t-neutral-900 animate-spin" />
                  ) : null}
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </KioskShell>
  )
}
