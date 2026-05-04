import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import AdminPanelHeader from '../components/AdminPanelHeader'

export default function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAlerts = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true)
      setError('')
    }
    try {
      const data = await api.get('/restaurant/alerts')
      const list = Array.isArray(data) ? data : []
      const active = list.filter((a) => String(a?.status || '').toLowerCase() !== 'completed')
      setAlerts(active)
      setError('')
    } catch (e) {
      setError(e.message)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAlerts({ silent: false })
    const interval = setInterval(() => fetchAlerts({ silent: true }), 5000)
    return () => clearInterval(interval)
  }, [fetchAlerts])

  return (
    <div className="flex min-h-full min-w-0 flex-1 flex-col">
      <AdminPanelHeader
        title="Allergy alerts"
        actionLabel="Refresh"
        onAction={() => fetchAlerts({ silent: false })}
        actionDisabled={loading}
      />
      {loading ? (
        <p className="p-4 text-gray-500 sm:p-6">Loading…</p>
      ) : error ? (
        <p className="p-4 text-red-500 sm:p-6">{error}</p>
      ) : (
        <div className="p-4 sm:p-6">
          {alerts.length === 0 ? (
            <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
              <p className="font-medium text-green-700">No active allergy alerts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert._id} className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-orange-900">Table #{alert.tableNo}</p>
                      <p className="mt-0.5 text-sm text-orange-700">
                        Concerns: {alert.allergiesInput?.join(', ') || 'flagged'}
                      </p>
                      <p className="mt-1 text-xs text-orange-500">
                        Status: <span className="capitalize">{alert.status}</span>
                        {' · '}
                        {new Date(alert.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span className="text-2xl">⚠️</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
