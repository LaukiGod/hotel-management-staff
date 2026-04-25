import { useEffect, useState } from 'react'
import { api } from '../api/client'

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

  if (loading) return <p className="p-6 text-gray-500">Loading...</p>
  if (error) return <p className="p-6 text-red-500">{error}</p>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Allergy Alerts</h1>
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
  )
}
