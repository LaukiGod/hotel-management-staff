import { useEffect, useState } from 'react'
import { api } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import AllergyBadge from '../components/AllergyBadge'
import { useAuth } from '../context/AuthContext'

export default function Tables() {
  const { user } = useAuth()
  const [tables, setTables] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTable, setSelectedTable] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get('/restaurant/tables'),
      api.get('/restaurant/orders').catch(() => []),
    ])
      .then(([tablesRes, ordersRes]) => {
        setTables(Array.isArray(tablesRes) ? tablesRes : [])
        setOrders(Array.isArray(ordersRes) ? ordersRes : [])
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
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

  if (loading) return <p className="p-6 text-gray-500">Loading...</p>
  if (error) return <p className="p-6 text-red-500">{error}</p>

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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Tables</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {tables.map(table => (
          <div
            key={table._id}
            onClick={() => setSelectedTable(table)}
            className={`rounded-xl border-2 p-4 text-center ${
              table.status === 'occupied'
                ? 'border-red-200 bg-red-50'
                : table.status === 'cleaning'
                  ? 'border-orange-200 bg-orange-50'
                  : 'border-green-200 bg-green-50'
            } cursor-pointer hover:shadow-sm transition-shadow`}
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
  )
}
