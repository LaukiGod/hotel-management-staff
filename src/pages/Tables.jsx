import { useEffect, useState } from 'react'
import { api } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import AllergyBadge from '../components/AllergyBadge'
import AdminPanelHeader from '../components/AdminPanelHeader'
import { useAuth } from '../context/AuthContext'

// QR icon inline — no extra dep
function QRIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm7-16v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4" />
    </svg>
  )
}

const STATUS_CONFIG = {
  occupied:  { dot: 'bg-red-500',    text: 'text-red-600',    label: 'Occupied',  card: 'border-red-100 bg-red-50/60' },
  cleaning:  { dot: 'bg-amber-400',  text: 'text-amber-600',  label: 'Cleaning',  card: 'border-amber-100 bg-amber-50/60' },
  available: { dot: 'bg-emerald-500',text: 'text-emerald-600',label: 'Available', card: 'border-emerald-100 bg-emerald-50/40' },
}

export default function Tables() {
  const { user } = useAuth()
  const [tables, setTables]             = useState([])
  const [orders, setOrders]             = useState([])
  const [selectedTable, setSelectedTable] = useState(null)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')
  const [qrTableNo, setQrTableNo]       = useState(null)   // which table's QR is open
  const [qrUrl, setQrUrl]               = useState(null)
  const [qrLoading, setQrLoading]       = useState(false)
  const [qrError, setQrError]           = useState('')

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
        if (firstLoad) { setLoading(false); firstLoad = false }
      }
    }

    loadTables()
    const interval = setInterval(loadTables, 5000)
    return () => { mounted = false; clearInterval(interval) }
  }, [])

  async function markAvailable(tableNo) {
    try {
      await api.patch(`/restaurant/tables/${tableNo}/available`, {})
      setTables(prev => prev.map(t => t.tableNo === tableNo ? { ...t, status: 'available', waiterRequested: false } : t))
      setSelectedTable(prev => prev?.tableNo === tableNo ? null : prev)
    } catch (e) { alert(e.message) }
  }

  async function generateQRCode(tableNo) {
    setQrTableNo(tableNo)
    setQrUrl(null)
    setQrLoading(true)
    setQrError('')
    try {
      const token = sessionStorage.getItem('token')
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      const response = await fetch(`${baseUrl}/restaurant/tables/${tableNo}/qrcode`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Failed to generate QR code')
      const blob = await response.blob()
      setQrUrl(URL.createObjectURL(blob))
    } catch (err) {
      setQrError(err.message)
    } finally {
      setQrLoading(false)
    }
  }

  function closeQR() { setQrTableNo(null); setQrUrl(null); setQrError('') }

  function downloadQR() {
    if (!qrUrl || !qrTableNo) return
    const link = document.createElement('a')
    link.href = qrUrl
    link.download = `table-${qrTableNo}-qr.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
    const tableOrders = orders.filter(o => Number(o?.tableNo) === Number(tableNo))
    return {
      totalOrders: tableOrders.length,
      totalBill: tableOrders.reduce((sum, o) => sum + orderTotal(o), 0),
    }
  }

  if (error) {
    return (
      <div className="flex min-h-full min-w-0 flex-1 flex-col">
        <AdminPanelHeader title="Tables" actionLabel="Add table" onAction={() => alert('Adding tables is not available in this build.')} />
        <p className="p-4 text-red-500 sm:p-6">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-full min-w-0 flex-1 flex-col">
      <AdminPanelHeader title="Tables" actionLabel="Add table" onAction={() => alert('Adding tables is not available in this build.')} />

      {loading ? (
        <p className="p-4 text-gray-400 sm:p-6">Loading…</p>
      ) : (
        <div className="p-4 sm:p-6">

          {/* ── Table Grid ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {tables.map(table => {
              const cfg = STATUS_CONFIG[table.status] ?? STATUS_CONFIG.available
              return (
                <div
                  key={table._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedTable(table)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedTable(table) } }}
                  className={`group relative rounded-xl border ${cfg.card} bg-gray-50 p-4 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5`}
                >
                  {/* Table number */}
                  <p className="text-xl font-bold text-gray-800 mb-2.5">#{table.tableNo}</p>

                  {/* Status row */}
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-block h-2 w-2 rounded-full ${cfg.dot} shrink-0`} />
                    <span className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</span>
                  </div>

                  {/* Alerts */}
                  {table.waiterRequested && (
                    <p className="mt-2 text-xs font-medium text-red-500 flex items-center gap-1">
                      <span>🔔</span> Waiter called
                    </p>
                  )}
                  {table.allergyAlert && (
                    <div className="mt-1.5">
                      <AllergyBadge />
                    </div>
                  )}

                  {/* Bottom row: Mark Available + QR */}
                  <div className="mt-3 flex items-center justify-between">
                    {user && table.status !== 'available' ? (
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); markAvailable(table.tableNo) }}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 underline-offset-2 hover:underline transition-colors"
                      >
                        Mark available
                      </button>
                    ) : (
                      <span />
                    )}

                    {/* QR button — subtle icon, always visible */}
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); generateQRCode(table.tableNo) }}
                      title={`QR code for Table ${table.tableNo}`}
                      className="rounded-md p-1 text-gray-400 hover:text-gray-700 hover:bg-white/80 transition-all"
                    >
                      <QRIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── QR Modal ── */}
          {qrTableNo !== null && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
              onClick={closeQR}
            >
              <div
                className="w-full max-w-xs rounded-2xl bg-white shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                {/* Modal header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">QR Code</p>
                    <h3 className="text-base font-bold text-gray-900 leading-tight">Table {qrTableNo}</h3>
                  </div>
                  <button
                    onClick={closeQR}
                    className="h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Modal body */}
                <div className="px-5 py-5 flex flex-col items-center">
                  {qrLoading ? (
                    <div className="flex flex-col items-center py-10 gap-3">
                      <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-gray-200 border-t-gray-800" />
                      <p className="text-sm text-gray-400">Generating…</p>
                    </div>
                  ) : qrError ? (
                    <div className="py-6 text-center">
                      <p className="text-sm text-red-500">{qrError}</p>
                      <button
                        onClick={() => generateQRCode(qrTableNo)}
                        className="mt-3 text-sm text-blue-600 hover:underline"
                      >
                        Try again
                      </button>
                    </div>
                  ) : qrUrl ? (
                    <>
                      <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                        <img src={qrUrl} alt={`QR code for table ${qrTableNo}`} className="h-64 w-64 object-contain" />
                      </div>
                      <p className="mt-3 text-xs text-gray-400 text-center">Scan to open the menu for this table</p>
                      <button
                        onClick={downloadQR}
                        className="mt-4 w-full rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download QR Code
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {/* ── Table Detail Modal ── */}
          {selectedTable && (
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedTable(null)}
            >
              <div
                className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Table details</p>
                    <h2 className="text-xl font-bold text-gray-900">#{selectedTable.tableNo}</h2>
                  </div>
                  <button
                    onClick={() => setSelectedTable(null)}
                    className="h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Body */}
                <div className="px-5 py-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Seated customer</p>
                  {selectedTable.currentUser ? (
                    <div className="space-y-2.5">
                      {[
                        ['Name',    selectedTable.currentUser.name || '—'],
                        ['Phone',   selectedTable.currentUser.phoneNo || '—'],
                        ['Allergies', Array.isArray(selectedTable.currentUser.allergies) && selectedTable.currentUser.allergies.length ? selectedTable.currentUser.allergies.join(', ') : 'None'],
                        ['Orders',  tableOrderSummary(selectedTable.tableNo).totalOrders],
                        ['Bill',    `₹${Math.round(tableOrderSummary(selectedTable.tableNo).totalBill)}`],
                      ].map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">{label}</span>
                          <span className="font-medium text-gray-800">{value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No customer details available.</p>
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