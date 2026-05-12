import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import AdminPanelHeader from '../components/AdminPanelHeader'
import { usePopup } from '../context/PopupContext'
import ConfirmDialog from '../components/ConfirmDialog'

const EMPTY_FORM = { name: '', price: '', ingredients: '', recipe: '', imageUrl: '', category: '', isAvailable: true }
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
  const notify = usePopup()
  const [dishes, setDishes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editDishId, setEditDishId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [filters, setFilters] = useState(loadInitialFilters)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => { load() }, [])

  useEffect(() => {
    localStorage.setItem(FILTERS_KEY, JSON.stringify(filters))
  }, [filters])

  async function load() {
    try {
      const data = await api.get('/restaurant/menu')
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
      isAvailable: dish.isAvailable !== false,
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
        isAvailable: form.isAvailable !== false,
      }
      if (editDishId !== null) {
        await api.put('/restaurant/update-dish', { dishId: editDishId, ...payload })
      } else {
        await api.post('/restaurant/add-dish', payload)
      }
      setShowForm(false)
      await load()
    } catch (e) {
      notify.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  function requestDelete(id) {
    setDeleteId(id)
    setConfirmOpen(true)
  }

  async function confirmDelete() {
    if (!deleteId) return
    try {
      await api.delete(`/restaurant/dish/${deleteId}`)
      setDishes((prev) => prev.filter((d) => d._id !== deleteId))
    } catch (e) {
      notify.error(e.message)
    } finally {
      setConfirmOpen(false)
      setDeleteId(null)
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
      <div className="mb-5 grid grid-cols-1 md:grid-cols-3 gap-3">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {dishes.length === 0 && <p className="text-gray-400 col-span-full">No dishes yet.</p>}
        {dishes.length > 0 && filteredDishes.length === 0 && (
          <p className="text-gray-400 col-span-full">No dishes match your search / filters.</p>
        )}
        {filteredDishes.map(dish => (
          <article
            key={dish._id}
            className={`overflow-hidden rounded-2xl border shadow-sm transition hover:shadow-md ${
              dish.isAvailable === false ? 'border-amber-200 bg-amber-50/40' : 'border-gray-200 bg-white'
            }`}
          >
            {dish.imageUrl ? (
              <img src={dish.imageUrl} alt={dish.name} className="w-full h-40 object-cover" />
            ) : (
              <div className="w-full h-40 border-b border-dashed border-gray-200 bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-11 h-11 rounded-xl bg-white border border-gray-200 flex items-center justify-center mx-auto text-lg">
                    🍽️
                  </div>
                  <p className="mt-2 text-xs font-medium text-gray-500">No image</p>
                </div>
              </div>
            )}

            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-gray-900 truncate">{dish.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{dish.category || 'General'}</p>
                </div>
                <p className="shrink-0 text-lg font-bold text-gray-900">₹{dish.price}</p>
              </div>

              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                    dish.isAvailable === false ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {dish.isAvailable === false ? 'Unavailable' : 'Available'}
                </span>
                {dish.dishId != null ? (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                    ID #{dish.dishId}
                  </span>
                ) : null}
              </div>

              <p className="mt-3 text-xs text-gray-500 min-h-8 line-clamp-2">
                {dish.recipe?.trim() || 'No recipe note added yet.'}
              </p>

              {dish.ingredients?.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {dish.ingredients.slice(0, 4).map((ing) => (
                    <span key={`${dish._id}-${ing}`} className="rounded-md bg-gray-100 px-2 py-1 text-[11px] text-gray-600">
                      {ing}
                    </span>
                  ))}
                  {dish.ingredients.length > 4 ? (
                    <span className="rounded-md bg-gray-100 px-2 py-1 text-[11px] text-gray-600">
                      +{dish.ingredients.length - 4} more
                    </span>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-4 grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await api.put('/restaurant/update-dish', {
                        dishId: dish.dishId ?? dish._id,
                        isAvailable: dish.isAvailable === false,
                      })
                      setDishes(prev => prev.map(d =>
                        d._id === dish._id ? { ...d, isAvailable: d.isAvailable === false } : d
                      ))
                      notify.success(`Dish marked ${dish.isAvailable === false ? 'available' : 'unavailable'}.`)
                    } catch (e) {
                      notify.error(e.message)
                    }
                  }}
                  className={`inline-flex items-center justify-center h-9 rounded-lg text-xs font-semibold border transition ${
                    dish.isAvailable === false
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  {dish.isAvailable === false ? 'Mark Available' : 'Mark Unavailable'}
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(dish)}
                    className="inline-flex items-center justify-center h-9 rounded-lg text-xs font-semibold border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => requestDelete(dish._id)}
                    className="inline-flex items-center justify-center h-9 rounded-lg text-xs font-semibold border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 p-4 sm:p-6 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{editDishId !== null ? 'Edit Dish' : 'Add Dish'}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {editDishId !== null ? 'Update dish details and availability.' : 'Create a new menu item for customers.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-sm text-gray-500 hover:text-gray-800 px-2 py-1 rounded-lg hover:bg-gray-100"
              >
                Close
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Dish Name *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
                <Field label="Category" value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} placeholder="General" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Price (INR) *" type="number" value={form.price} onChange={v => setForm(f => ({ ...f, price: v }))} />
                <Field
                  label="Image URL"
                  value={form.imageUrl}
                  onChange={v => setForm(f => ({ ...f, imageUrl: v }))}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              {form.imageUrl?.trim() ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs text-gray-500 mb-2">Image preview</p>
                  <img src={form.imageUrl} alt="Preview" className="h-32 w-full rounded-lg object-cover" />
                </div>
              ) : null}

              <Field
                label="Ingredients (comma separated)"
                value={form.ingredients}
                onChange={v => setForm(f => ({ ...f, ingredients: v }))}
                placeholder="e.g. mozzarella, basil, tomato"
              />
              <Field
                label="Recipe / Notes"
                textarea
                value={form.recipe}
                onChange={v => setForm(f => ({ ...f, recipe: v }))}
                placeholder="Short preparation notes for staff..."
              />

              <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isAvailable !== false}
                  onChange={(e) => setForm(f => ({ ...f, isAvailable: e.target.checked }))}
                  className="h-4 w-4"
                />
                <span>
                  <span className="font-medium text-gray-900">Available for customer ordering</span>
                  <span className="block text-xs text-gray-500 mt-0.5">Turn this off to temporarily hide the dish from customers.</span>
                </span>
              </label>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-white flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-gray-900 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-800 disabled:opacity-50"
              >
                {saving ? 'Saving...' : editDishId !== null ? 'Save Changes' : 'Add Dish'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Delete dish"
        description="Are you sure you want to delete this dish? This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        danger
        onCancel={() => {
          setConfirmOpen(false)
          setDeleteId(null)
        }}
        onConfirm={confirmDelete}
      />
    </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', textarea, placeholder = '' }) {
  const cls = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      {textarea
        ? <textarea rows={4} value={value} onChange={e => onChange(e.target.value)} className={cls} placeholder={placeholder} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} className={cls} placeholder={placeholder} />
      }
    </div>
  )
}
