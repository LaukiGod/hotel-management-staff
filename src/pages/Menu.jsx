import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import AdminPanelHeader from '../components/AdminPanelHeader'

const EMPTY_FORM = { name: '', price: '', ingredients: '', recipe: '', imageUrl: '', category: '' }
const FILTERS_KEY = 'adminMenuFilters:v1'

function safeParse(json) {
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

function loadInitialFilters() {
  const raw = localStorage.getItem(FILTERS_KEY)
  const parsed = raw ? safeParse(raw) : null
  return parsed && typeof parsed === 'object'
    ? {
        q: String(parsed.q || ''),
        category: String(parsed.category || 'all'),
      }
    : { q: '', category: 'all' }
}

export default function Menu() {
  const [dishes, setDishes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editDishId, setEditDishId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [filters, setFilters] = useState(loadInitialFilters)

  useEffect(() => { load() }, [])

  useEffect(() => {
    localStorage.setItem(FILTERS_KEY, JSON.stringify(filters))
  }, [filters])

  async function load() {
    try {
      const data = await api.get('/user/menu')
      setDishes(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function openAdd() {
    setEditDishId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(dish) {
    setEditDishId(dish.dishId ?? dish._id)
    setForm({
      name: dish.name,
      price: dish.price,
      category: dish.category || '',
      ingredients: dish.ingredients?.join(', ') || '',
      recipe: dish.recipe || '',
      imageUrl: dish.imageUrl || '',
    })
    setShowForm(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const image = String(form.imageUrl || '').trim()
      if (image && !/^https?:\/\//i.test(image)) {
        throw new Error('Image URL must start with http:// or https://')
      }
      const payload = {
        name: form.name,
        price: Number(form.price),
        category: form.category.trim() || 'General',
        ingredients: form.ingredients.split(',').map(s => s.trim()).filter(Boolean),
        recipe: form.recipe,
        imageUrl: image,
      }
      if (editDishId !== null) {
        await api.put('/restaurant/update-dish', { dishId: editDishId, ...payload })
      } else {
        await api.post('/restaurant/add-dish', payload)
      }
      setShowForm(false)
      await load()
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this dish?')) return
    try {
      await api.delete(`/restaurant/dish/${id}`)
      setDishes(prev => prev.filter(d => d._id !== id))
    } catch (e) {
      alert(e.message)
    }
  }

  const categories = useMemo(() => {
    const set = new Set()
    for (const d of dishes || []) {
      const c = String(d?.category || 'General').trim() || 'General'
      set.add(c)
    }
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b))]
  }, [dishes])

  const filteredDishes = useMemo(() => {
    const q = String(filters.q || '').trim().toLowerCase()
    const cat = String(filters.category || 'all')
    return (dishes || []).filter((d) => {
      const dishCat = String(d?.category || 'General').trim() || 'General'
      if (cat !== 'all' && dishCat !== cat) return false

      if (!q) return true
      const hay = [
        d?.name,
        d?.recipe,
        dishCat,
        Array.isArray(d?.ingredients) ? d.ingredients.join(' ') : '',
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [dishes, filters.category, filters.q])

  if (error) {
    return (
      <div className="flex min-h-full min-w-0 flex-1 flex-col">
        <AdminPanelHeader
          title="Menu"
          badge="ADMIN"
          actionLabel="Add dish"
          onAction={openAdd}
        />
        <p className="p-4 text-red-500 sm:p-6">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-full min-w-0 flex-1 flex-col">
      <AdminPanelHeader
        title="Menu"
        badge="ADMIN"
        actionLabel="Add dish"
        onAction={openAdd}
      />
      {loading ? (
        <p className="p-4 text-gray-500 sm:p-6">Loading…</p>
      ) : (
    <div className="p-4 sm:p-6">
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Search</label>
          <input
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            placeholder="Search by name, recipe, ingredients, category…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Category</label>
          <select
            value={filters.category}
            onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? 'All categories' : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {(filters.q.trim() || filters.category !== 'all') ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            Showing <span className="font-semibold text-gray-800">{filteredDishes.length}</span> of{' '}
            <span className="font-semibold text-gray-800">{dishes.length}</span> dishes
          </p>
          <button
            type="button"
            onClick={() => setFilters({ q: '', category: 'all' })}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
          >
            Clear filters
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {dishes.length === 0 && <p className="text-gray-400 col-span-full">No dishes yet.</p>}
        {dishes.length > 0 && filteredDishes.length === 0 && (
          <p className="text-gray-400 col-span-full">No dishes match your search / filters.</p>
        )}
        {filteredDishes.map(dish => (
          <div key={dish._id} className="bg-white rounded-xl border border-gray-200 p-4">
            {dish.imageUrl ? (
              <img src={dish.imageUrl} alt={dish.name} className="w-full h-36 object-cover rounded-lg mb-3" />
            ) : (
              <div className="w-full h-36 rounded-lg mb-3 border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center mx-auto text-lg">
                    🍽️
                  </div>
                  <p className="mt-2 text-xs font-medium text-gray-500">No image</p>
                </div>
              </div>
            )}
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900">{dish.name}</p>
                <p className="text-sm text-gray-500 mt-0.5">₹{dish.price}</p>
                <p className="text-xs text-gray-400 mt-0.5">{dish.category || 'General'}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openEdit(dish)}
                  className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-xs font-semibold border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(dish._id)}
                  className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-xs font-semibold border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300 transition"
                >
                  Delete
                </button>
              </div>
            </div>
            {dish.ingredients?.length > 0 && (
              <p className="text-xs text-gray-400 mt-2">{dish.ingredients.join(', ')}</p>
            )}
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">{editDishId !== null ? 'Edit Dish' : 'Add Dish'}</h2>
            <div className="space-y-3">
              <Field label="Name *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
              <Field label="Price *" type="number" value={form.price} onChange={v => setForm(f => ({ ...f, price: v }))} />
              <Field label="Category / Type" value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} />
              <Field label="Ingredients (comma separated)" value={form.ingredients} onChange={v => setForm(f => ({ ...f, ingredients: v }))} />
              <Field label="Recipe" textarea value={form.recipe} onChange={v => setForm(f => ({ ...f, recipe: v }))} />
              <Field label="Image URL" value={form.imageUrl} onChange={v => setForm(f => ({ ...f, imageUrl: v }))} />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-gray-900 text-white rounded-lg py-2 text-sm disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', textarea }) {
  const cls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {textarea
        ? <textarea rows={3} value={value} onChange={e => onChange(e.target.value)} className={cls} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} className={cls} />
      }
    </div>
  )
}
