import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import AdminPanelHeader from '../components/AdminPanelHeader'

export default function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadAlerts() {
    try {
      const data = await api.get('/restaurant/alerts')
      setAlerts(data)
      setError('')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAlerts()
    const interval = setInterval(loadAlerts, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="flex min-h-full min-w-0 flex-1 flex-col">
      <AdminPanelHeader
        title="Allergy alerts"
        actionLabel="Refresh"
        onAction={load}
        actionDisabled={loading}
      />
      {loading ? (
        <p className="p-4 text-gray-500 sm:p-6">Loading…</p>
      ) : error ? (
        <p className="p-4 text-red-500 sm:p-6">{error}</p>
      ) : (
    <div className="p-4 sm:p-6">
      {alerts.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <p className="text-green-700 font-medium">No active allergy alerts</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => (
            <div key={alert._id} className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-orange-900">Table #{alert.tableNo}</p>
                  <p className="text-sm text-orange-700 mt-0.5">
                    Concerns: {alert.allergiesInput?.join(', ') || 'flagged'}
                  </p>
                  <p className="text-xs text-orange-500 mt-1">
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
