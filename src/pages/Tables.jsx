import { useEffect, useState } from 'react'
import { api } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import AllergyBadge from '../components/AllergyBadge'
import AdminPanelHeader from '../components/AdminPanelHeader'
import { useAuth } from '../context/AuthContext'

export default function Tables() {
  const { user } = useAuth()
  const [tables, setTables] = useState([])
  const [orders, setOrders] = useState([])
  const [selectedTable, setSelectedTable] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    let firstLoad = true

    async function loadTables() {
      try {
        const [tablesRes, ordersRes] = await Promise.all([
          api.get('/restaurant/tables'),
          api.get('/restaurant/orders').catch(() => []),
        ])
        if (!mounted) return
        setTables(Array.isArray(tablesRes) ? tablesRes : [])
        setOrders(Array.isArray(ordersRes) ? ordersRes : [])
        setError('')
      } catch (e) {
        if (!mounted) return
        setError(e.message)
      } finally {
        if (firstLoad) {
          setLoading(false)
          firstLoad = false
        }
      }
    }

    loadTables()
    const interval = setInterval(loadTables, 5000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  async function markAvailable(tableNo) {
    try {
      await api.patch(`/restaurant/tables/${tableNo}/available`, {})
      setTables((prev) => prev.map((t) => (t.tableNo === tableNo ? { ...t, status: 'available', waiterRequested: false } : t)))
      setSelectedTable((prev) => (prev?.tableNo === tableNo ? null : prev))
    } catch (e) {
      alert(e.message)
    }
  }

  if (error) {
    return (
      <div className="flex min-h-full min-w-0 flex-1 flex-col">
        <AdminPanelHeader
          title="Tables"
          actionLabel="Add table"
          onAction={() => alert('Adding tables is not available in this build. Contact your administrator.')}
        />
        <p className="p-4 text-red-500 sm:p-6">{error}</p>
      </div>
    )
  }

  function getDishPrice(dish) {
    if (!dish || typeof dish === 'string') return 0
    const price = Number(dish.price)
    return Number.isFinite(price) ? price : 0
  }

  function orderTotal(order) {
    if (!Array.isArray(order?.dishes)) return 0
    return order.dishes.reduce((sum, dish) => sum + getDishPrice(dish), 0)
  }

  function tableOrderSummary(tableNo) {
    const tableOrders = orders.filter((o) => Number(o?.tableNo) === Number(tableNo))
    const totalBill = tableOrders.reduce((sum, o) => sum + orderTotal(o), 0)
    return {
      totalOrders: tableOrders.length,
      totalBill,
    }
  }

  return (
    <div className="flex min-h-full min-w-0 flex-1 flex-col">
      <AdminPanelHeader
        title="Tables"
        actionLabel="Add table"
        onAction={() => alert('Adding tables is not available in this build. Contact your administrator.')}
      />
      {loading ? (
        <p className="p-4 text-gray-500 sm:p-6">Loading…</p>
      ) : (
    <div className="p-4 sm:p-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {tables.map(table => (
          <div
            key={table._id}
            role="button"
            tabIndex={0}
            onClick={() => setSelectedTable(table)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setSelectedTable(table)
              }
            }}
            className={`rounded-xl border-2 p-4 text-center transition-shadow hover:shadow-sm ${
              table.status === 'occupied'
                ? 'border-red-200 bg-red-50'
                : table.status === 'cleaning'
                  ? 'border-orange-200 bg-orange-50'
                  : 'border-green-200 bg-green-50'
            } cursor-pointer`}
          >
            <p className="text-2xl font-bold text-gray-800 mb-2">#{table.tableNo}</p>
            <StatusBadge status={table.status} />
            {table.waiterRequested && <p className="text-xs text-red-600 mt-2 font-medium">Waiter requested</p>}
            {table.allergyAlert && (
              <div className="mt-2">
                <AllergyBadge />
              </div>
            )}
            {user && table.status !== 'available' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  markAvailable(table.tableNo)
                }}
                className="mt-3 text-xs text-blue-700 hover:underline"
              >
                Mark Available
              </button>
            )}
          </div>
        ))}
      </div>
      {selectedTable && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedTable(null)}>
          <div
            className="w-full max-w-md rounded-xl bg-white shadow-xl border border-gray-200 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500">Table</p>
                <h2 className="text-2xl font-bold text-gray-900">#{selectedTable.tableNo}</h2>
              </div>
              <button
                onClick={() => setSelectedTable(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>

            <div className="mt-4 rounded-lg border border-gray-200 p-4 text-left">
              <p className="text-sm font-semibold text-gray-800 mb-3">Seated customer details</p>
              {selectedTable.currentUser ? (
                <div className="space-y-2 text-sm text-gray-700">
                  <p><span className="font-medium">Name:</span> {selectedTable.currentUser.name || '—'}</p>
                  <p><span className="font-medium">Phone:</span> {selectedTable.currentUser.phoneNo || '—'}</p>
                  <p>
                    <span className="font-medium">Allergies:</span>{' '}
                    {Array.isArray(selectedTable.currentUser.allergies) && selectedTable.currentUser.allergies.length
                      ? selectedTable.currentUser.allergies.join(', ')
                      : 'None'}
                  </p>
                  <p>
                    <span className="font-medium">Total Orders:</span>{' '}
                    {tableOrderSummary(selectedTable.tableNo).totalOrders}
                  </p>
                  <p>
                    <span className="font-medium">Total Bill:</span>{' '}
                    ₹{Math.round(tableOrderSummary(selectedTable.tableNo).totalBill)}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-600">No seated customer details available for this table.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
      )}
    </div>
  )
}
