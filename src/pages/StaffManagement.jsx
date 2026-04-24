import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

const EMPTY_FORM = { name: '', email: '', role: 'STAFF' }

export default function StaffManagement() {
  const { user: me } = useAuth()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const data = await api.get('/auth/staff')
      setStaff(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd() {
    setSaving(true)
    try {
      await api.post('/auth/staff', form)
      setShowForm(false)
      setForm(EMPTY_FORM)
      await load()
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(member) {
    const isSelf = member._id === me?.id
    if (isSelf) return alert("You can't deactivate your own account.")
    try {
      const action = member.isActive ? 'deactivate' : 'activate'
      await api.patch(`/auth/staff/${member._id}/${action}`)
      setStaff(prev => prev.map(s => s._id === member._id ? { ...s, isActive: !s.isActive } : s))
    } catch (e) {
      alert(e.message)
    }
  }

  async function handleDelete(id) {
    if (id === me?.id) return alert("You can't delete your own account.")
    if (!confirm('Permanently delete this staff member?')) return
    try {
      await api.delete(`/auth/staff/${id}`)
      setStaff(prev => prev.filter(s => s._id !== id))
    } catch (e) {
      alert(e.message)
    }
  }

  if (loading) return <p className="p-6 text-gray-500">Loading...</p>
  if (error) return <p className="p-6 text-red-500">{error}</p>

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Staff</h1>
        <button
          onClick={() => { setForm(EMPTY_FORM); setShowForm(true) }}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors"
        >
          + Add Staff
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500 text-xs uppercase tracking-wide">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {staff.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No staff members</td></tr>
            )}
            {staff.map(member => (
              <tr key={member._id} className="border-b border-gray-50 last:border-0">
                <td className="px-4 py-3 font-medium">
                  {member.name}
                  {member._id === me?.id && <span className="ml-1 text-xs text-gray-400">(you)</span>}
                </td>
                <td className="px-4 py-3 text-gray-500">{member.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${member.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {member.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${member.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {member.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {member._id !== me?.id && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleToggle(member)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {member.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(member._id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold mb-4">Add Staff Member</h2>
            <div className="space-y-3">
              <Field label="Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
              <Field label="Email" type="email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} />
              <div>
                <label className="block text-xs text-gray-500 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="STAFF">STAFF</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm">Cancel</button>
              <button onClick={handleAdd} disabled={saving} className="flex-1 bg-gray-900 text-white rounded-lg py-2 text-sm disabled:opacity-50">
                {saving ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }) {
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
