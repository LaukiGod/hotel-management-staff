import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import AdminPanelHeader from '../components/AdminPanelHeader'
import { usePopup } from '../context/PopupContext'

function getRowClass(item) {
  const now = new Date()
  if (item.expiryDate) {
    const expiry = new Date(item.expiryDate)
    const daysLeft = (expiry - now) / (1000 * 60 * 60 * 24)
    if (daysLeft < 0) return 'bg-red-50'
    if (daysLeft <= 7) return 'bg-yellow-50'
  }
  if (item.quantity <= item.lowStockThreshold) return 'bg-orange-50'
  return ''
}

const EMPTY_FORM = { name: '', quantity: '', unit: 'kg', category: 'other', lowStockThreshold: 10, expiryDate: '' }
const UNITS = ['kg', 'grams', 'litres', 'ml', 'pieces', 'packets']
const CATEGORIES = ['vegetable', 'fruit', 'dairy', 'meat', 'spice', 'beverage', 'other']

export default function Inventory() {
  const { user } = useAuth()
  const notify = usePopup()
  const isAdmin = user?.role === 'ADMIN'

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await api.get('/restaurant/inventory')
      const normalizedItems = Array.isArray(data) ? data : data?.items
      setItems(Array.isArray(normalizedItems) ? normalizedItems : [])
    } catch (e) {
      setError(e.message)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  function openAdd() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(item) {
    setEditId(item._id)
    setForm({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      lowStockThreshold: item.lowStockThreshold,
      expiryDate: item.expiryDate ? item.expiryDate.slice(0, 10) : '',
    })
    setShowForm(true)
  }

  async function handleSave(e) {
    e?.preventDefault()
    setSaving(true)
    try {
      const trimmedName = form.name.trim()
      if (!trimmedName) {
        throw new Error('Name is required')
      }
      const quantity = Number(form.quantity)
      const lowStockThreshold = Number(form.lowStockThreshold)
      if (Number.isNaN(quantity) || Number.isNaN(lowStockThreshold)) {
        throw new Error('Quantity and low stock threshold must be valid numbers')
      }

      const payload = {
        ...form,
        name: trimmedName,
        quantity,
        lowStockThreshold,
        expiryDate: form.expiryDate || null,
      }
      if (editId) {
        await api.put(`/restaurant/inventory/${editId}`, payload)
        await load()
      } else {
        await api.post('/restaurant/add-inventory', payload)
        await load()
      }
      setShowForm(false)
    } catch (e) {
      notify.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this item?')) return
    try {
      await api.delete(`/restaurant/inventory/${id}`)
      setItems(prev => prev.filter(i => i._id !== id))
    } catch (e) {
      notify.error(e.message)
    }
  }

  if (error && !loading) {
    return (
      <div className="flex min-h-full min-w-0 flex-1 flex-col">
        <AdminPanelHeader
          title="Inventory"
          actionLabel={isAdmin ? 'Add item' : 'Refresh'}
          onAction={isAdmin ? openAdd : load}
        />
        <p className="p-4 text-red-500 sm:p-6">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-full min-w-0 flex-1 flex-col">
      <AdminPanelHeader
        title="Inventory"
        actionLabel={isAdmin ? 'Add item' : 'Refresh'}
        onAction={isAdmin ? openAdd : load}
        actionDisabled={loading}
      />
      {loading ? (
        <p className="p-4 text-gray-500 sm:p-6">Loading…</p>
      ) : (
    <div className="p-4 sm:p-6">

      <div className="mb-4 flex gap-4 text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 inline-block" /> Expired</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-100 inline-block" /> Expiring soon</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-100 inline-block" /> Low stock</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500 text-xs uppercase tracking-wide">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Expiry</th>
              {isAdmin && <th className="px-4 py-3"></th>}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">No items</td></tr>
            )}
            {items.map(item => (
              <tr key={item._id} className={`border-b border-gray-50 ${getRowClass(item)}`}>
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3">{item.quantity}</td>
                <td className="px-4 py-3">{item.unit}</td>
                <td className="px-4 py-3 capitalize">{item.category}</td>
                <td className="px-4 py-3 text-gray-500">
                  {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '—'}
                </td>
                {isAdmin && (
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(item)} className="text-blue-600 hover:underline text-xs">Edit</button>
                      <button onClick={() => handleDelete(item._id)} className="text-red-500 hover:underline text-xs">Delete</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">{editId ? 'Edit Item' : 'Add Item'}</h2>
            <div className="space-y-3">
              <Input label="Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Quantity" type="number" value={form.quantity} onChange={v => setForm(f => ({ ...f, quantity: v }))} />
                <Select label="Unit" value={form.unit} options={UNITS} onChange={v => setForm(f => ({ ...f, unit: v }))} />
              </div>
              <Select label="Category" value={form.category} options={CATEGORIES} onChange={v => setForm(f => ({ ...f, category: v }))} />
              <Input label="Low Stock Threshold" type="number" value={form.lowStockThreshold} onChange={v => setForm(f => ({ ...f, lowStockThreshold: v }))} />
              <Input label="Expiry Date (optional)" type="date" value={form.expiryDate} onChange={v => setForm(f => ({ ...f, expiryDate: v }))} />
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 bg-gray-900 text-white rounded-lg py-2 text-sm disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
      )}
    </div>
  )
}

function Input({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}

function Select({ label, value, options, onChange }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}
