import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import AdminPanelHeader from '../components/AdminPanelHeader'

export default function Dashboard() {
  const { user } = useAuth()
  const [tables, setTables] = useState([])
  const [orders, setOrders] = useState([])
  const [alerts, setAlerts] = useState([])
  const [notifications, setNotifications] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [t, o, a] = await Promise.all([
        api.get('/restaurant/tables'),
        api.get('/restaurant/orders'),
        api.get('/restaurant/alerts'),
      ])
      setTables(t)
      setOrders(o)
      setAlerts(a)
      const n = await api.get('/restaurant/notifications')
      setNotifications(n)
      if (user?.role === 'ADMIN') {
        const m = await api.get('/restaurant/metrics')
        setMetrics(m)
      } else {
        setMetrics(null)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [user?.role])

  useEffect(() => {
    load()
  }, [load])

  const activeTables = tables.filter(t => t.status === 'occupied').length
  const pendingOrders = orders.filter(o => ['created', 'confirmed', 'preparing'].includes(o.status)).length

  return (
    <div className="flex min-h-full min-w-0 flex-1 flex-col">
      <AdminPanelHeader
        title="Dashboard"
        subtitle="Here's what's happening right now."
        actionLabel="Refresh"
        onAction={load}
        actionDisabled={loading}
      />
      {loading ? (
        <p className="p-4 text-gray-500 sm:p-6">Loading…</p>
      ) : (
    <div className="p-4 sm:p-6">
      <p className="mb-6 text-sm text-gray-600">
        <span className="font-medium text-gray-900">Welcome{user?.name ? `, ${user.name}` : ''}.</span>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card label="Occupied Tables" value={activeTables} color="bg-blue-50 text-blue-700" />
        <Card label="Pending Orders" value={pendingOrders} color="bg-yellow-50 text-yellow-700" />
        <Card label="Allergy Alerts" value={alerts.length} color="bg-orange-50 text-orange-700" />
      </div>

      {notifications && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <Card label="New Orders" value={notifications.newOrders} color="bg-indigo-50 text-indigo-700" />
          <Card label="Meal Completed" value={notifications.mealCompleted} color="bg-emerald-50 text-emerald-700" />
          <Card label="Waiter Calls" value={notifications.waiterRequests} color="bg-rose-50 text-rose-700" />
        </div>
      )}

      {user?.role === 'ADMIN' && metrics && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
          <p className="font-semibold text-gray-900 mb-2">Manager Metrics</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <Metric label="Customers Served" value={metrics.customersServed} />
            <Metric label="Revenue" value={`Rs ${metrics.revenue}`} />
            <Metric label="Occupied Tables" value={metrics.tableUsage?.occupied || 0} />
            <Metric label="Cleaning Tables" value={metrics.tableUsage?.cleaning || 0} />
          </div>
        </div>
      )}

      {alerts.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="font-semibold text-orange-800 mb-2">⚠ Active Allergy Alerts</p>
          <ul className="space-y-1">
            {alerts.map(a => (
              <li key={a._id} className="text-sm text-orange-700">
                Table {a.tableNo} — {a.allergiesInput?.join(', ') || 'concerns flagged'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
      )}
    </div>
  )
}

function Card({ label, value, color }) {
  return (
    <div className={`rounded-xl p-5 ${color}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm mt-1 font-medium opacity-80">{label}</p>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-gray-500 text-xs">{label}</p>
      <p className="text-gray-900 font-semibold">{value}</p>
    </div>
  )
}
