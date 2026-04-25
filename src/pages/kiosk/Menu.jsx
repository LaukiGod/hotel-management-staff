import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import useEmblaCarousel from 'embla-carousel-react'
import { kioskAxios } from '../../api/kioskAxios'
import KioskShell from '../../components/KioskShell'
import { useKioskSession } from '../../context/KioskSessionContext'

export default function KioskMenu() {
  const navigate = useNavigate()
  const { tableNo, user, cart, setQty, allergies, setAllergies, setOrderId } = useKioskSession()
  const [dishes, setDishes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [emblaRef] = useEmblaCarousel({ loop: true, align: 'start' })
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === 'undefined' ? 1280 : window.innerWidth
  )

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
      .finally(() => setLoading(false))
    return () => {
      mounted = false
    }
  }, [navigate, tableNo, user])

  const cartCount = useMemo(() => cart.reduce((sum, i) => sum + (Number(i.qty) || 0), 0), [cart])
  const total = useMemo(() => cart.reduce((sum, i) => sum + (Number(i.qty) || 0) * (Number(i.dish?.price) || 0), 0), [cart])
  const dishIdsExpanded = useMemo(() => {
    return cart.flatMap((i) => {
      const id = i.dish?.dishId || i.dish?._id
      const qty = Number(i.qty) || 0
      return id ? Array.from({ length: qty }, () => id) : []
    })
  }, [cart])

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const dishesPerRow = useMemo(() => {
    if (viewportWidth < 640) return 2
    if (viewportWidth < 1024) return 3
    if (viewportWidth < 1280) return 4
    return 5
  }, [viewportWidth])
  const rowsPerPage = 2
  const pageSize = dishesPerRow * rowsPerPage
  const dishPages = useMemo(() => {
    const pages = []
    for (let i = 0; i < dishes.length; i += pageSize) {
      pages.push(dishes.slice(i, i + pageSize))
    }
    return pages.length ? pages : [[]]
  }, [dishes])

  function getQty(dish) {
    const idKey = dish.dishId || dish._id
    const inCart = cart.find((i) => (i.dish?.dishId || i.dish?._id) === idKey)
    return inCart?.qty || 0
  }

  async function placeOrder() {
    if (!dishIdsExpanded.length || placing) return
    setPlacing(true)
    try {
      const res = await kioskAxios.post('/user/order', { tableNo: Number(tableNo), dishes: dishIdsExpanded })
      const id = res.data?.orderId || res.data?.order?._id
      if (!id) throw new Error('Order placed, but no orderId returned')
      setOrderId(String(id))
      navigate('/payment')
    } catch (e) {
      alert(e?.response?.data?.message || e.message || 'Failed to place order')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <KioskShell className="relative">
      <div className="px-4 sm:px-5 pt-6 sm:pt-8 pb-6 max-w-[1600px] mx-auto">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <p className="text-white/70 text-sm">Step 3 of 5</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold mt-1 leading-none tracking-tight">Menu</h1>
            <p className="mt-2 text-lg sm:text-2xl leading-none text-white/70">Table #{tableNo}</p>
          </div>
          <button
            onClick={() => navigate('/register', { state: { from: '/menu' } })}
            className="text-sm sm:text-xl leading-none text-white/70 hover:text-white transition-colors"
          >
            Edit details
          </button>
        </div>

        {loading ? <p className="mt-8 text-white/60">Loading dishes…</p> : null}
        {error ? <p className="mt-8 text-red-300">{error}</p> : null}

        <div className="pb-28">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {dishPages.map((page, pageIdx) => (
                <div key={pageIdx} className="min-w-0 shrink-0 grow-0 basis-full pl-0">
                  <div
                    className="grid gap-3 sm:gap-4"
                    style={{ gridTemplateColumns: `repeat(${dishesPerRow}, minmax(0, 1fr))` }}
                  >
                    {page.map((dish) => {
                      const idKey = dish.dishId || dish._id
                      const qty = getQty(dish)
                      const ingredients = Array.isArray(dish.ingredients) ? dish.ingredients.slice(0, 3).join(', ') : ''
                      return (
                        <motion.div
                          key={idKey}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, ease: 'easeOut' }}
                          className="rounded-2xl overflow-hidden border border-white/10 bg-neutral-900/95"
                        >
                          <div className="h-28 sm:h-32 lg:h-36 bg-white/5">
                            {dish.imageUrl ? (
                              <img src={dish.imageUrl} alt={dish.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full bg-gradient-to-br from-white/10 to-white/0" />
                            )}
                          </div>
                          <div className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm sm:text-base font-bold leading-tight kiosk-clamp-2">{dish.name}</p>
                              <p className="text-base sm:text-lg font-extrabold whitespace-nowrap">₹{dish.price}</p>
                            </div>
                            <p className="mt-1 text-xs text-white/65 kiosk-clamp-1">{ingredients}</p>
                            <div className="mt-2 h-10 sm:h-10 rounded-xl border border-white/15 bg-black/35 flex items-center justify-between px-1.5">
                              <button
                                onClick={() => setQty(dish, Math.max(0, qty - 1))}
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/10 hover:bg-white/15 transition text-xl leading-none"
                              >
                                −
                              </button>
                              <p className="font-extrabold text-lg sm:text-xl leading-none">{qty}</p>
                              <button
                                onClick={() => setQty(dish, qty + 1)}
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/10 hover:bg-white/15 transition text-xl leading-none"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                    {Array.from({ length: Math.max(0, pageSize - page.length) }).map((_, idx) => (
                      <div key={`empty-${pageIdx}-${idx}`} className="rounded-2xl border border-transparent bg-transparent" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating cart button */}
      <button
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
            <div className="absolute inset-0 bg-black/70" onClick={() => setDrawerOpen(false)} />
            <motion.div
              className="relative w-full max-w-3xl rounded-t-3xl border border-white/10 bg-neutral-950 p-6 pb-8"
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 40 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold">Your cart</h2>
                <button className="text-sm text-white/70 hover:text-white" onClick={() => setDrawerOpen(false)}>
                  Close
                </button>
              </div>

              <div className="mt-5 space-y-3 max-h-[45vh] overflow-auto pr-1">
                {cart.length ? (
                  cart.map((i) => {
                    const idKey = i.dish?.dishId || i.dish?._id
                    const qty = Number(i.qty) || 0
                    return (
                      <div key={idKey} className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{i.dish?.name}</p>
                          <p className="text-xs text-white/60 mt-1">₹{i.dish?.price} each</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => setQty(i.dish, qty - 1)} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/15 transition text-xl">
                            −
                          </button>
                          <span className="w-10 text-center font-extrabold">{qty}</span>
                          <button onClick={() => setQty(i.dish, qty + 1)} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/15 transition text-xl">
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
                onClick={placeOrder}
                disabled={!cartCount || placing}
                className="mt-4 w-full h-14 rounded-2xl bg-white text-neutral-900 font-extrabold hover:bg-white/90 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {placing ? <span className="inline-block w-4 h-4 rounded-full border-2 border-neutral-900/30 border-t-neutral-900 animate-spin" /> : null}
                Pay via UPI
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </KioskShell>
  )
}

