import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { platformApi } from '../../api/client'

const STATUS_STYLES = {
  active: 'bg-green-500/10 text-green-400 ring-green-500/30',
  suspended: 'bg-amber-500/10 text-amber-400 ring-amber-500/30',
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-800/40 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
    </div>
  )
}

export default function PlatformRestaurants() {
  const [rows, setRows] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null) // { _id, slug, name }
  const [confirmText, setConfirmText] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [list, s] = await Promise.all([
        platformApi.get('/restaurants'),
        platformApi.get('/stats'),
      ])
      setRows(list)
      setStats(s)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function toggleStatus(row) {
    setBusyId(row._id)
    setError('')
    try {
      const next = row.status === 'active' ? 'suspended' : 'active'
      await platformApi.patch(`/restaurants/${row._id}/status`, { status: next })
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  async function destroy() {
    if (!confirmDelete) return
    setBusyId(confirmDelete._id)
    setError('')
    try {
      await platformApi.delete(`/restaurants/${confirmDelete._id}`, {
        confirmSlug: confirmText.trim(),
      })
      setConfirmDelete(null)
      setConfirmText('')
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  const appOrigin = window.location.origin

  return (
    <div>
      {stats && (
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Restaurants" value={stats.restaurants} />
          <StatCard label="Active" value={stats.active} />
          <StatCard label="Suspended" value={stats.suspended} />
          <StatCard label="Orders today" value={stats.ordersToday} />
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-gray-500">Loading restaurants…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-700 px-6 py-12 text-center">
          <p className="text-gray-400">No restaurants yet.</p>
          <Link
            to="/platform/restaurants/new"
            className="mt-3 inline-block rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-900"
          >
            Add the first restaurant
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-800">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-gray-800/60 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Restaurant</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">Staff</th>
                <th className="px-4 py-3">Tables</th>
                <th className="px-4 py-3">Dishes</th>
                <th className="px-4 py-3">Orders today</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {rows.map((r) => (
                <tr key={r._id} className="text-gray-300">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{r.name}</p>
                    <p className="text-xs text-gray-500">{r.contactEmail || '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`${appOrigin}/r/${r.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gray-400 underline underline-offset-4 hover:text-white"
                    >
                      /r/{r.slug}
                    </a>
                  </td>
                  <td className="px-4 py-3">{r.counts.staff}</td>
                  <td className="px-4 py-3">{r.counts.tables}</td>
                  <td className="px-4 py-3">{r.counts.dishes}</td>
                  <td className="px-4 py-3">{r.counts.ordersToday}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ring-1 ${
                        STATUS_STYLES[r.status] || ''
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        disabled={busyId === r._id}
                        onClick={() => toggleStatus(r)}
                        className="rounded-md border border-gray-700 px-2.5 py-1 text-xs text-gray-300 transition hover:bg-gray-800 disabled:opacity-50"
                      >
                        {r.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                      <button
                        disabled={busyId === r._id}
                        onClick={() => {
                          setConfirmDelete(r)
                          setConfirmText('')
                        }}
                        className="rounded-md border border-red-500/30 px-2.5 py-1 text-xs text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
          <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-6">
            <h2 className="text-lg font-semibold text-white">Delete {confirmDelete.name}?</h2>
            <p className="mt-2 text-sm text-gray-400">
              This permanently removes every order, table, dish, inventory item and staff account
              belonging to this restaurant. It cannot be undone.
            </p>
            <p className="mt-4 text-sm text-gray-400">
              Type <code className="rounded bg-gray-800 px-1.5 py-0.5 text-gray-200">{confirmDelete.slug}</code> to confirm:
            </p>
            <input
              autoFocus
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="mt-2 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white outline-none focus:border-gray-500"
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-md px-4 py-2 text-sm text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                disabled={confirmText.trim() !== confirmDelete.slug || busyId === confirmDelete._id}
                onClick={destroy}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
