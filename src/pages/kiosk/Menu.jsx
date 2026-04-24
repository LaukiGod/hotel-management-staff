import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
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
      <div className="px-6 py-7 max-w-6xl mx-auto">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm">Step 3 of 5</p>
            <h1 className="text-3xl md:text-4xl font-extrabold mt-1">Menu</h1>
            <p className="mt-2 text-sm text-white/70">Table #{tableNo}</p>
          </div>
          <button onClick={() => navigate('/register')} className="text-sm text-white/70 hover:text-white transition-colors">
            Edit details
          </button>
        </div>

        {loading ? <p className="mt-8 text-white/60">Loading dishes…</p> : null}
        {error ? <p className="mt-8 text-red-300">{error}</p> : null}

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-24">
          {dishes.map((dish) => {
            const idKey = dish.dishId || dish._id
            const inCart = cart.find((i) => (i.dish?.dishId || i.dish?._id) === idKey)
            const qty = inCart?.qty || 0
            const ingredients = Array.isArray(dish.ingredients) ? dish.ingredients.slice(0, 3).join(', ') : ''
            return (
              <motion.div
                key={idKey}
                whileHover={{ y: -2 }}
                className="rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur"
              >
                <div className="aspect-[16/10] bg-white/5">
                  {dish.imageUrl ? (
                    <img src={dish.imageUrl} alt={dish.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-white/10 to-white/0" />
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-extrabold leading-snug">{dish.name}</p>
                      <p className="mt-1 text-xs text-white/65 kiosk-clamp-2">{ingredients}</p>
                    </div>
                    <p className="text-lg font-extrabold whitespace-nowrap">₹{dish.price}</p>
                  </div>

                  <div className="mt-4">
                    {qty <= 0 ? (
                      <button
                        onClick={() => setQty(dish, 1)}
                        className="w-full h-12 rounded-2xl bg-white text-neutral-900 font-semibold hover:bg-white/90 transition"
                      >
                        + Add
                      </button>
                    ) : (
                      <div className="h-12 rounded-2xl border border-white/15 bg-black/25 flex items-center justify-between px-2">
                        <button
                          onClick={() => setQty(dish, qty - 1)}
                          className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/15 transition text-xl"
                        >
                          −
                        </button>
                        <p className="font-extrabold text-lg">{qty}</p>
                        <button
                          onClick={() => setQty(dish, qty + 1)}
                          className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/15 transition text-xl"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Floating cart button */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-40 h-14 px-5 rounded-2xl bg-white text-neutral-900 font-extrabold shadow-xl hover:bg-white/90 transition flex items-center gap-3"
      >
        Cart
        <span className="min-w-8 h-8 px-2 rounded-xl bg-neutral-900 text-white flex items-center justify-center text-sm">
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

