import { useEffect, useState } from 'react'
import { api } from '../api/client'

const EMPTY_FORM = { name: '', price: '', ingredients: '', recipe: '', imageUrl: '', category: '' }

export default function Menu() {
  const [dishes, setDishes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editDishId, setEditDishId] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

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
      const payload = {
        name: form.name,
        price: Number(form.price),
        category: form.category.trim() || 'General',
        ingredients: form.ingredients.split(',').map(s => s.trim()).filter(Boolean),
        recipe: form.recipe,
        imageUrl: form.imageUrl,
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

  if (loading) return <p className="p-6 text-gray-500">Loading...</p>
  if (error) return <p className="p-6 text-red-500">{error}</p>

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Menu</h1>
        <button
          onClick={openAdd}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors"
        >
          + Add Dish
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {dishes.length === 0 && <p className="text-gray-400 col-span-full">No dishes yet.</p>}
        {dishes.map(dish => (
          <div key={dish._id} className="bg-white rounded-xl border border-gray-200 p-4">
            {dish.imageUrl && (
              <img src={dish.imageUrl} alt={dish.name} className="w-full h-36 object-cover rounded-lg mb-3" />
            )}
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900">{dish.name}</p>
                <p className="text-sm text-gray-500 mt-0.5">₹{dish.price}</p>
                <p className="text-xs text-gray-400 mt-0.5">{dish.category || 'General'}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEdit(dish)} className="text-blue-600 hover:underline text-xs">Edit</button>
                <button onClick={() => handleDelete(dish._id)} className="text-red-500 hover:underline text-xs">Delete</button>
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
              <Field label="Category / Type *" value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} />
              <Field label="Ingredients (comma separated)" value={form.ingredients} onChange={v => setForm(f => ({ ...f, ingredients: v }))} />
              <Field label="Recipe *" textarea value={form.recipe} onChange={v => setForm(f => ({ ...f, recipe: v }))} />
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
