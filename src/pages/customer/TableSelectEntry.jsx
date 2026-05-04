import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api/client'
import { onCustomerFlowEnter } from '../../utils/sessionCoordination'

export default function TableSelectEntry() {
  const navigate = useNavigate()
  const { tableId } = useParams()
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function bookAndRedirect() {
      const n = Number(tableId)
      if (!Number.isFinite(n) || n <= 0) {
        if (!cancelled) setError('Invalid table id')
        return
      }
      try {
        const result = await api.get(`/user/table-select/${n}`)
        const target = result?.entryPath || `/customer/menu?tableId=${n}&flow=quick`
        if (!cancelled) {
          onCustomerFlowEnter()
          navigate(target, { replace: true })
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to book table')
      }
    }

    bookAndRedirect()
    return () => {
      cancelled = true
    }
  }, [navigate, tableId])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-gray-500">Booking your table…</p>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        {error ? (
          <button
            type="button"
            onClick={() => navigate('/tables', { replace: true })}
            className="mt-4 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Go to table selection
          </button>
        ) : null}
      </div>
    </div>
  )
}

