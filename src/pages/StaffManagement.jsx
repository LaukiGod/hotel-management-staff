import { useEffect, useState, useCallback } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import AdminPanelHeader from '../components/AdminPanelHeader'
import { usePopup } from '../context/PopupContext'
import ConfirmDialog from '../components/ConfirmDialog'

const EMPTY_FORM = { name: '', email: '', role: 'STAFF' }

function initials(name) {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
}

function timeSince(d) {
  if (!d) return 'Never'
  const days = Math.floor((Date.now() - new Date(d)) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

export default function StaffManagement() {
  const { user: me } = useAuth()
  const notify = usePopup()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [deleteName, setDeleteName] = useState('')

  const load = useCallback(async () => {
    try {
      const data = await api.get('/auth/staff')
      setStaff(data || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleAdd() {
    if (!form.name.trim() || !form.email.trim()) {
      notify.info('Name and email are required')
      return
    }
    setSaving(true)
    try {
      await api.post('/auth/staff', form)
      setShowForm(false)
      setForm(EMPTY_FORM)
      await load()
    } catch (e) {
      notify.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(member) {
    if (member._id === me?.id) {
      notify.info("You can't deactivate your own account.")
      return
    }
    setTogglingId(member._id)
    try {
      const action = member.isActive ? 'deactivate' : 'activate'
      await api.patch(`/auth/staff/${member._id}/${action}`)
      setStaff(prev => prev.map(s => s._id === member._id ? { ...s, isActive: !s.isActive } : s))
    } catch (e) {
      notify.error(e.message)
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete(id, name) {
    if (id === me?.id) {
      notify.info("You can't delete your own account.")
      return
    }
    setDeleteId(id)
    setDeleteName(name)
    setConfirmOpen(true)
  }

  async function confirmDelete() {
    if (!deleteId) return
    try {
      await api.delete(`/auth/staff/${deleteId}`)
      setStaff((prev) => prev.filter((s) => s._id !== deleteId))
    } catch (e) {
      notify.error(e.message)
    } finally {
      setConfirmOpen(false)
      setDeleteId(null)
      setDeleteName('')
    }
  }

  const totalStaff = staff.length
  const activeStaff = staff.filter(s => s.isActive).length
  const admins = staff.filter(s => s.role === 'ADMIN').length

  if (error) {
    return (
      <div className="flex min-h-full min-w-0 flex-1 flex-col">
        <AdminPanelHeader
          title="Staff management"
          badge="ADMIN"
          subtitle="Manage access and roles for your team"
          actionLabel="Add staff"
          onAction={() => {
            setForm(EMPTY_FORM)
            setShowForm(true)
          }}
        />
        <p className="p-4 text-red-500 sm:p-6">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-full min-w-0 flex-1 flex-col">
      <AdminPanelHeader
        title="Staff management"
        badge="ADMIN"
        subtitle="Manage access and roles for your team"
        actionLabel="Add staff"
        onAction={() => {
          setForm(EMPTY_FORM)
          setShowForm(true)
        }}
        actionDisabled={saving}
      />
      {loading ? (
        <div className="flex items-center gap-3 p-4 text-gray-400 sm:p-6">
          <svg className="h-5 w-5 shrink-0 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading staff…
        </div>
      ) : (
      <>
      <div className="space-y-6 p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
            <p className="text-3xl font-bold text-gray-900">{totalStaff}</p>
            <p className="text-sm text-gray-500 mt-1">Total Staff</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
            <p className="text-3xl font-bold text-emerald-600">{activeStaff}</p>
            <p className="text-sm text-gray-500 mt-1">Active</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
            <p className="text-3xl font-bold text-purple-600">{admins}</p>
            <p className="text-sm text-gray-500 mt-1">Admins</p>
          </div>
        </div>

        {/* Staff cards */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Team Members</h2>
          <div className="space-y-3">
            {staff.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-400">
                <p className="text-3xl mb-2">👥</p>
                <p className="font-medium">No staff members yet</p>
                <p className="text-sm mt-1">Add your first team member above</p>
              </div>
            )}

            {/* Admins first */}
            {[...staff].sort((a, b) => {
              if (a.role === 'ADMIN' && b.role !== 'ADMIN') return -1
              if (a.role !== 'ADMIN' && b.role === 'ADMIN') return 1
              return 0
            }).map(member => {
              const isSelf = member._id === me?.id
              const isToggling = togglingId === member._id

              return (
                <div
                  key={member._id}
                  className={`bg-white rounded-2xl border p-4 flex items-center gap-4 flex-wrap transition-all
                    ${!member.isActive ? 'opacity-60 border-gray-100' : 'border-gray-200 hover:shadow-sm'}`}
                >
                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold shrink-0
                    ${member.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {initials(member.name)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{member.name}</span>
                      {isSelf && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">You</span>}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold
                        ${member.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {member.role}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                        ${member.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {member.isActive ? '● Active' : '○ Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5 truncate">{member.email}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Joined {timeSince(member.createdAt)}
                    </p>
                  </div>

                  {/* Actions */}
                  {!isSelf && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggle(member)}
                        disabled={isToggling}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50
                          ${member.isActive
                            ? 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'}`}
                      >
                        {isToggling ? '…' : member.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(member._id, member.name)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Auth info */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <div className="flex gap-3">
            <span className="text-xl shrink-0">ℹ️</span>
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">How staff login works</p>
              <p className="text-sm text-blue-700">
                Staff must sign in with Google OAuth using the email address registered here.
                Pre-registering an email grants them access — they cannot sign in with an unregistered email.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Add Staff Member</h2>
            <p className="text-sm text-gray-500 mb-5">They'll be able to sign in with this Google account.</p>
            <div className="space-y-4">
              <Field label="Full Name *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
              <Field label="Google Email *" type="email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} />
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {['STAFF', 'ADMIN'].map(r => (
                    <button
                      key={r} type="button"
                      onClick={() => setForm(f => ({ ...f, role: r }))}
                      className={`py-2.5 rounded-xl text-sm font-semibold border transition-colors
                        ${form.role === r
                          ? r === 'ADMIN' ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                    >
                      {r === 'ADMIN' ? '👑 ' : '👤 '}{r}
                    </button>
                  ))}
                </div>
                {form.role === 'ADMIN' && (
                  <p className="text-xs text-purple-600 mt-2 bg-purple-50 rounded-lg px-3 py-2">
                    Admins can manage menu, inventory, and staff.
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleAdd} disabled={saving}
                className="flex-1 bg-gray-900 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 transition-colors">
                {saving ? 'Adding…' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Delete staff member"
        description={`Permanently delete ${deleteName}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        danger
        onCancel={() => {
          setConfirmOpen(false)
          setDeleteId(null)
          setDeleteName('')
        }}
        onConfirm={confirmDelete}
      />
      </>
      )}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}
