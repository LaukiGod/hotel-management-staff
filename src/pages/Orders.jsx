import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import AllergyBadge from '../components/AllergyBadge'
import AdminPanelHeader from '../components/AdminPanelHeader'

const STATUSES = ['created', 'paid', 'preparing', 'served', 'completed']

const LINE_ITEM_STATUSES = ['queued', 'preparing', 'ready', 'served']

const LINE_STATUS_LABEL = {
  queued: 'Received',
  preparing: 'Cooking',
  ready: 'Ready',
  served: 'Served',
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(null)
  const [selected, setSelected] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [tables, setTables] = useState([])
  const [menu, setMenu] = useState([])
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [tableNo, setTableNo] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [phoneNo, setPhoneNo] = useState('')
  const [cart, setCart] = useState({})
  const [allergiesInput, setAllergiesInput] = useState('')
  const [editingDetails, setEditingDetails] = useState(false)
  const [detailSaving, setDetailSaving] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [editCart, setEditCart] = useState({})
  const [editAllergiesInput, setEditAllergiesInput] = useState('')

  async function loadOrders() {
    try {
      const data = await api.get('/restaurant/orders')
      setOrders(data)
      setError('')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
    const interval = setInterval(loadOrders, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!addOpen) return
    setCreateError('')
    Promise.all([
      api.get('/restaurant/tables'),
      api.get('/user/menu'),
    ])
      .then(([t, m]) => {
        setTables(Array.isArray(t) ? t : [])
        setMenu(Array.isArray(m) ? m : [])
      })
      .catch((e) => setCreateError(e.message))
  }, [addOpen])

  async function handleStatusChange(orderId, status) {
    setUpdating(orderId)
    try {
      await api.post('/restaurant/order-status', { orderId, status })
      setOrders(prev =>
        prev.map(o => (o._id === orderId ? { ...o, status } : o))
      )
      setSelected((prev) => (prev?._id === orderId ? { ...prev, status } : prev))
    } catch (e) {
      alert(e.message)
    } finally {
      setUpdating(null)
    }
  }

  async function handleLineItemStatus(orderId, lineIndex, status) {
    setUpdating(orderId)
    try {
      const res = await api.post('/restaurant/line-item-status', { orderId, lineIndex, status })
      const updated = res?.order
      if (updated?._id) {
        setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)))
        setSelected((prev) => (prev?._id === updated._id ? updated : prev))
      }
    } catch (e) {
      alert(e.message)
    } finally {
      setUpdating(null)
    }
  }

  const cartCount = useMemo(
    () => Object.values(cart).reduce((sum, q) => sum + (Number(q) || 0), 0),
    [cart]
  )

  const editCartCount = useMemo(
    () => Object.values(editCart).reduce((sum, q) => sum + (Number(q) || 0), 0),
    [editCart]
  )

  function openAdd() {
    setAddOpen(true)
    setTableNo('')
    setCustomerName('')
    setPhoneNo('')
    setCart({})
    setAllergiesInput('')
    setCreateError('')
  }

  function buildCartFromOrder(order) {
    const counts = {}
    for (const d of order?.dishes || []) {
      const dishId = typeof d === 'string' ? d : d?._id
      if (!dishId) continue
      counts[dishId] = (counts[dishId] || 0) + 1
    }
    return counts
  }

  function openOrder(order) {
    setSelected(order)
    setEditingDetails(false)
    setDetailSaving(false)
    setDetailError('')
    setEditCart(buildCartFromOrder(order))
    setEditAllergiesInput(Array.isArray(order?.allergiesInput) ? order.allergiesInput.join(', ') : '')

    if (!menu.length) {
      api.get('/user/menu')
        .then((m) => setMenu(Array.isArray(m) ? m : []))
        .catch(() => {})
    }
  }

  function closeAdd() {
    if (creating) return
    setAddOpen(false)
  }

  function setQty(dishId, qty) {
    const q = Math.max(0, Number(qty) || 0)
    setCart((prev) => ({ ...prev, [dishId]: q }))
  }

  async function createOrder() {
    const tNo = Number(tableNo)
    const digits = String(phoneNo || '').replace(/\D/g, '').slice(0, 10)
    const dishIds = Object.entries(cart).flatMap(([id, qty]) => Array.from({ length: Math.max(0, Number(qty) || 0) }, () => id))

    if (!tNo) return setCreateError('Please select a table.')
    if (!customerName.trim()) return setCreateError('Customer name is required.')
    if (!/^\d{10}$/.test(digits)) return setCreateError('Phone number must be exactly 10 digits.')
    if (cartCount < 1) return setCreateError('Please add at least one dish.')

    const allergies = allergiesInput
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)

    setCreating(true)
    setCreateError('')
    try {
      const res = await api.post('/restaurant/create-order', {
        tableNo: tNo,
        customerName: customerName.trim(),
        phoneNo: digits,
        dishes: dishIds,
        allergiesInput: allergies,
      })

      const newOrder = res?.order
      if (newOrder?._id) {
        setOrders((prev) => [newOrder, ...prev])
      } else {
        // fallback: refresh
        const refreshed = await api.get('/restaurant/orders')
        setOrders(refreshed)
      }
      setAddOpen(false)
    } catch (e) {
      setCreateError(e.message)
    } finally {
      setCreating(false)
    }
  }

  function setEditQty(dishId, qty) {
    const q = Math.max(0, Number(qty) || 0)
    setEditCart((prev) => ({ ...prev, [dishId]: q }))
  }

  async function updateOrderDetails() {
    if (!selected?._id) return

    const dishIds = Object.entries(editCart).flatMap(([id, qty]) =>
      Array.from({ length: Math.max(0, Number(qty) || 0) }, () => id)
    )
    if (editCartCount < 1) return setDetailError('Please add at least one dish.')

    const allergies = editAllergiesInput
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)

    setDetailSaving(true)
    setDetailError('')
    try {
      const res = await api.put('/restaurant/update-order', {
        orderId: selected._id,
        dishes: dishIds,
        allergiesInput: allergies,
      })

      const updated = res?.order
      if (updated?._id) {
        setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)))
        setSelected(updated)
      }
      setEditingDetails(false)
    } catch (e) {
      setDetailError(e.message)
    } finally {
      setDetailSaving(false)
    }
  }

  function getDishName(d) {
    return typeof d === 'string' ? d : d?.name
  }

  function getDishPrice(d) {
    const p = typeof d === 'string' ? 0 : Number(d?.price)
    return Number.isFinite(p) ? p : 0
  }

  function orderTotal(order) {
    if (!Array.isArray(order?.dishes)) return 0
    return order.dishes.reduce((sum, d) => sum + getDishPrice(d), 0)
  }

  function orderDishCounts(order) {
    const counts = new Map()
    for (const d of order?.dishes || []) {
      const name = getDishName(d) || 'Dish'
      counts.set(name, (counts.get(name) || 0) + 1)
    }
    return Array.from(counts.entries()).map(([name, qty]) => ({ name, qty }))
  }

  return (
    <div className="flex min-h-full min-w-0 flex-1 flex-col">
      <AdminPanelHeader
        title="Orders"
        actionLabel="Add order"
        onAction={openAdd}
        actionDisabled={!!creating}
      />
      {loading ? (
        <p className="p-4 text-gray-500 sm:p-6">Loading…</p>
      ) : error ? (
        <p className="p-4 text-red-500 sm:p-6">{error}</p>
      ) : (
    <div className="p-4 sm:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.length === 0 && (
          <p className="text-gray-400">No orders yet.</p>
        )}
        {orders.map(order => (
          <button
            key={order._id}
            onClick={() => openOrder(order)}
            className="bg-white rounded-2xl border border-gray-200 p-4 text-left hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500">Table</p>
                <p className="text-2xl font-extrabold text-gray-900">#{order.tableNo}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={order.status} />
                {order.allergyAlert && <AllergyBadge />}
              </div>
            </div>

            <div className="mt-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-xl font-bold text-gray-900">₹{Math.round(orderTotal(order))}</p>
              </div>
              <p className="text-xs text-gray-400 text-right">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Order details</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold text-gray-900">Table #{selected.tableNo}</p>
                  <StatusBadge status={selected.status} />
                  {selected.allergyAlert && <AllergyBadge />}
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-sm text-gray-500 hover:text-gray-900">Close</button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-gray-600">
                  {new Date(selected.createdAt).toLocaleString()}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setEditingDetails((v) => !v)
                      setDetailError('')
                    }}
                    className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50"
                  >
                    {editingDetails ? 'Cancel edit' : 'Edit details'}
                  </button>
                  <p className="text-sm text-gray-600">Update status</p>
                  <select
                    value={selected.status}
                    disabled={updating === selected._id}
                    onChange={e => handleStatusChange(selected._id, e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500 mb-1">Allergies</p>
                <p className="text-sm text-gray-900">
                  {Array.isArray(selected.allergiesInput) && selected.allergiesInput.length
                    ? selected.allergiesInput.join(', ')
                    : 'None'}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">Items</p>
                  <p className="text-sm text-gray-700">
                    Total: <span className="font-semibold">₹{Math.round(orderTotal(selected))}</span>
                  </p>
                </div>
                <div className="divide-y divide-gray-200">
                  {Array.isArray(selected.lineItems) && selected.lineItems.length ? (
                    selected.lineItems.map((li, idx) => (
                      <div key={li._id || idx} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm text-gray-900 font-medium truncate">{li.dish?.name || 'Item'}</p>
                          {li.dish?.price != null ? (
                            <p className="text-xs text-gray-500 mt-0.5">₹{li.dish.price}</p>
                          ) : null}
                        </div>
                        <select
                          value={li.status || 'queued'}
                          disabled={updating === selected._id}
                          onChange={(e) => handleLineItemStatus(selected._id, idx, e.target.value)}
                          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white shrink-0"
                        >
                          {LINE_ITEM_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {LINE_STATUS_LABEL[s] || s}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))
                  ) : orderDishCounts(selected).length ? (
                    orderDishCounts(selected).map((i) => (
                      <div key={i.name} className="px-4 py-3 flex items-center justify-between">
                        <p className="text-sm text-gray-900">{i.name}</p>
                        <p className="text-sm text-gray-600">×{i.qty}</p>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-4">
                      <p className="text-sm text-gray-500">No dishes</p>
                    </div>
                  )}
                </div>
              </div>

              {editingDetails && (
                <div className="rounded-xl border border-gray-200 p-4 space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Allergies (comma-separated)</label>
                    <input
                      value={editAllergiesInput}
                      onChange={(e) => setEditAllergiesInput(e.target.value)}
                      placeholder="nuts, dairy"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-900">Edit items</p>
                    <div className="max-h-[260px] overflow-auto pr-1 space-y-2 mt-2">
                      {menu.map((dish) => (
                        <div key={dish._id} className="border border-gray-200 rounded-xl p-3 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{dish.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">₹{dish.price}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => setEditQty(dish._id, (editCart[dish._id] || 0) - 1)}
                              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200"
                            >
                              −
                            </button>
                            <span className="w-7 text-center text-sm font-semibold">{editCart[dish._id] || 0}</span>
                            <button
                              onClick={() => setEditQty(dish._id, (editCart[dish._id] || 0) + 1)}
                              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {detailError ? <p className="text-sm text-red-600">{detailError}</p> : null}
                  <div className="flex justify-end">
                    <button
                      onClick={updateOrderDetails}
                      disabled={detailSaving}
                      className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm hover:bg-gray-700 disabled:opacity-50"
                    >
                      {detailSaving ? 'Saving…' : 'Save order details'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeAdd} />
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Create order (staff)</p>
                <p className="text-lg font-bold text-gray-900">Add Order</p>
              </div>
              <button onClick={closeAdd} className="text-sm text-gray-500 hover:text-gray-900">Close</button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Table</label>
                  <select
                    value={tableNo}
                    onChange={(e) => setTableNo(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    <option value="">Select table…</option>
                    {tables
                      .slice()
                      .sort((a, b) => Number(a.tableNo) - Number(b.tableNo))
                      .map((t) => (
                        <option key={t._id || t.tableNo} value={t.tableNo}>
                          #{t.tableNo} — {t.status}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Customer name</label>
                    <input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Walk-in"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Phone (10 digits)</label>
                    <input
                      value={phoneNo}
                      onChange={(e) => setPhoneNo(String(e.target.value || '').replace(/\D/g, '').slice(0, 10))}
                      inputMode="numeric"
                      placeholder="9876543210"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Allergies (comma-separated)</label>
                  <input
                    value={allergiesInput}
                    onChange={(e) => setAllergiesInput(e.target.value)}
                    placeholder="nuts, dairy"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                {createError ? <p className="text-sm text-red-600">{createError}</p> : null}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <p className="text-sm text-gray-600">Items: <span className="font-semibold">{cartCount}</span></p>
                  <button
                    onClick={createOrder}
                    disabled={creating}
                    className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm hover:bg-gray-700 disabled:opacity-50"
                  >
                    {creating ? 'Creating…' : 'Create Order'}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900">Menu</p>
                <p className="text-xs text-gray-500 mt-0.5 mb-3">Tap +/− to set quantity</p>
                <div className="max-h-[420px] overflow-auto pr-1 space-y-2">
                  {menu.length === 0 ? (
                    <p className="text-sm text-gray-400">No dishes found. Add dishes from Admin Menu.</p>
                  ) : (
                    menu.map((dish) => (
                      <div key={dish._id} className="border border-gray-200 rounded-xl p-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{dish.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">₹{dish.price}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setQty(dish._id, (cart[dish._id] || 0) - 1)}
                            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200"
                          >
                            −
                          </button>
                          <span className="w-7 text-center text-sm font-semibold">{cart[dish._id] || 0}</span>
                          <button
                            onClick={() => setQty(dish._id, (cart[dish._id] || 0) + 1)}
                            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
      )}
    </div>
  )
}
