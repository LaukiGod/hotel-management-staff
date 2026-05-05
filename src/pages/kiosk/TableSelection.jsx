import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { kioskAxios } from '../../api/kioskAxios'
import KioskShell from '../../components/KioskShell'
import { useKioskSession } from '../../context/KioskSessionContext'

const STATUS_STYLES = {
  available: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  occupied: 'bg-red-50 text-red-900 border-red-200',
  cleaning: 'bg-gray-50 text-gray-800 border-gray-200',
}

function statusLabel(s) {
  if (s === 'available') return 'Available'
  if (s === 'occupied') return 'Occupied'
  if (s === 'cleaning') return 'Cleaning'
  return s || 'Unknown'
}

export default function KioskTableSelection() {
  const navigate = useNavigate()
  const { resetSession } = useKioskSession()
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [confirming, setConfirming] = useState(false)
  const [modalError, setModalError] = useState('')

  useEffect(() => {
    let mounted = true
    let firstLoad = true

    async function fetchTables() {
      try {
        const r = await kioskAxios.get('/restaurant/tables')
        if (!mounted) return
        setTables(Array.isArray(r.data) ? r.data : r.data?.tables || [])
        setError('')
      } catch (e) {
        if (!mounted) return
        setError(e?.response?.data?.message || e.message || 'Failed to load tables')
      } finally {
        if (!mounted) return
        if (firstLoad) {
          setLoading(false)
          firstLoad = false
        }
      }
    }

    fetchTables()
    const interval = setInterval(fetchTables, 4000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  const sorted = useMemo(() => [...tables].sort((a, b) => Number(a.tableNo) - Number(b.tableNo)), [tables])

  function pickTable(t) {
    if (!t || t.status !== 'available') return
    setModalError('')
    setSelected(t)
  }

  async function confirm() {
    if (!selected || confirming) return
    const tableNum = Number(selected.tableNo)
    setConfirming(true)
    setModalError('')
    try {
      await kioskAxios.get(`/user/table-select/${tableNum}`)
      resetSession()
      setSelected(null)
      navigate(`/customer/menu?tableId=${tableNum}&flow=quick`, { replace: true })
    } catch (e) {
      setModalError(e?.response?.data?.message || e.message || 'Could not start session for this table')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <KioskShell className="relative bg-white text-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-gray-500">Step 1 of 2</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-gray-900">Select your table</h1>
            <p className="mt-1 text-sm text-gray-500">Tap a table card to confirm and open the menu.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
          >
            Back
          </button>
        </div>

        {loading ? <p className="mt-6 text-sm text-gray-500">Loading tables…</p> : null}
        {error ? <p className="mt-6 text-sm text-red-600">{error}</p> : null}

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {sorted.map((t) => {
            const disabled = t.status !== 'available'
            const badge = STATUS_STYLES[t.status] || STATUS_STYLES.cleaning
            return (
              <button
                key={t._id || t.tableNo}
                onClick={() => pickTable(t)}
                disabled={disabled}
                className={[
                  'group text-left rounded-2xl border border-gray-200 bg-white p-4 transition shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300',
                  disabled ? 'opacity-45 cursor-not-allowed' : 'hover:bg-gray-50 hover:-translate-y-0.5 active:translate-y-0',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Table</p>
                    <p className="text-2xl font-extrabold tracking-tight text-gray-900">#{t.tableNo}</p>
                  </div>
                  <div className={`px-2 py-1 text-[11px] font-semibold rounded-full border ${badge}`}>
                    {statusLabel(t.status)}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <TableIcon className="w-10 h-10 text-gray-700" />
                  <div className="flex items-center gap-2">
                    {t.allergyAlert ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                        <span className="text-base leading-none">⚠</span>
                        Allergy
                      </span>
                    ) : null}
                    {t.waiterRequested ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full bg-pink-50 text-pink-900 border border-pink-200">
                        Waiter
                      </span>
                    ) : null}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <AnimatePresence>
        {selected ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setSelected(null)} />
            <motion.div
              className="relative w-full max-w-md rounded-3xl border border-gray-200 bg-white shadow-xl p-6"
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.98, opacity: 0, y: 6 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <p className="text-gray-500 text-sm">Confirm table</p>
              <h2 className="mt-1 text-2xl font-extrabold">Table #{selected.tableNo}</h2>
              <p className="mt-3 text-sm text-gray-600">
                Opens the menu to add dishes. We will ask for your name when you confirm your order.
              </p>
              {modalError ? <p className="mt-3 text-sm text-red-600">{modalError}</p> : null}

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={confirming}
                  onClick={() => setSelected(null)}
                  className="h-12 rounded-2xl border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={confirming}
                  onClick={confirm}
                  className="h-12 rounded-2xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition disabled:opacity-50"
                >
                  {confirming ? 'Starting…' : 'Confirm Table'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </KioskShell>
  )
}

function TableIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M18 22c0-3.314 2.686-6 6-6h16c3.314 0 6 2.686 6 6v4H18v-4Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M14 26h36v10c0 3.314-2.686 6-6 6H20c-3.314 0-6-2.686-6-6V26Z" stroke="currentColor" strokeWidth="2" />
      <path d="M22 42v10M42 42v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 52h12M36 52h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
    </svg>
  )
}

