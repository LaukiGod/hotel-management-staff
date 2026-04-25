import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { kioskAxios } from '../../api/kioskAxios'
import { KioskBackButton } from '../../components/kiosk/KioskBackButton'
import KioskShell from '../../components/KioskShell'
import { useKioskSession } from '../../context/KioskSessionContext'

const STATUS_STYLES = {
  available: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/25',
  occupied: 'bg-red-500/15 text-red-200 border-red-400/25',
  cleaning: 'bg-slate-400/15 text-slate-200 border-slate-400/25',
}

function statusLabel(s) {
  if (s === 'available') return 'Available'
  if (s === 'occupied') return 'Occupied'
  if (s === 'cleaning') return 'Cleaning'
  return s || 'Unknown'
}

export default function KioskTableSelection() {
  const navigate = useNavigate()
  const { setTableNo, resetSession } = useKioskSession()
  function startOver() {
    resetSession()
    navigate('/', { replace: true })
  }
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    let mounted = true
    kioskAxios
      .get('/restaurant/tables')
      .then((r) => {
        if (!mounted) return
        setTables(Array.isArray(r.data) ? r.data : r.data?.tables || [])
      })
      .catch((e) => setError(e?.response?.data?.message || e.message || 'Failed to load tables'))
      .finally(() => setLoading(false))
    return () => {
      mounted = false
    }
  }, [])

  const sorted = useMemo(() => [...tables].sort((a, b) => Number(a.tableNo) - Number(b.tableNo)), [tables])

  function pickTable(t) {
    if (!t || t.status !== 'available') return
    setSelected(t)
  }

  function confirm() {
    if (!selected) return
    setTableNo(Number(selected.tableNo))
    setSelected(null)
    navigate('/register')
  }

  return (
    <KioskShell className="relative">
      <div className="px-6 py-8 max-w-6xl mx-auto">
        <div className="mb-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <KioskBackButton onBack={() => navigate('/', { state: { kioskIntent: 'showWelcome' } })}>Welcome</KioskBackButton>
          <button
            type="button"
            onClick={startOver}
            className="self-start sm:self-center text-sm text-rose-200/90 hover:text-rose-100 transition-colors rounded-xl px-2 py-1.5 -mr-1"
          >
            Start over
          </button>
        </div>
        <div>
          <p className="text-white/70 text-sm">Step 1 of 5</p>
          <h1 className="text-3xl md:text-4xl font-extrabold mt-1">Select your table</h1>
        </div>

        {loading ? <p className="mt-8 text-white/60">Loading tables…</p> : null}
        {error ? <p className="mt-8 text-red-300">{error}</p> : null}

        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {sorted.map((t) => {
            const disabled = t.status !== 'available'
            const badge = STATUS_STYLES[t.status] || STATUS_STYLES.cleaning
            return (
              <button
                key={t._id || t.tableNo}
                onClick={() => pickTable(t)}
                disabled={disabled}
                className={[
                  'group text-left rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4 transition',
                  disabled ? 'opacity-45 cursor-not-allowed' : 'hover:bg-white/10 hover:-translate-y-0.5 active:translate-y-0',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-white/60">Table</p>
                    <p className="text-2xl font-extrabold tracking-tight">#{t.tableNo}</p>
                  </div>
                  <div className={`px-2 py-1 text-[11px] rounded-full border ${badge}`}>
                    {statusLabel(t.status)}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <TableIcon className="w-10 h-10 text-white/70" />
                  <div className="flex items-center gap-2">
                    {t.waiterRequested ? (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-pink-500/15 text-pink-200 border border-pink-400/25">
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
            <div className="absolute inset-0 bg-black/70" onClick={() => setSelected(null)} />
            <motion.div
              className="relative w-full max-w-md rounded-3xl border border-white/10 bg-neutral-900/95 backdrop-blur p-6"
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.98, opacity: 0, y: 6 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <p className="text-white/70 text-sm">Confirm table</p>
              <h2 className="mt-1 text-2xl font-extrabold">Table #{selected.tableNo}</h2>
              <p className="mt-3 text-sm text-white/70">
                Continue to enter your details and start ordering.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSelected(null)}
                  className="h-12 rounded-2xl border border-white/15 bg-white/5 text-white hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirm}
                  className="h-12 rounded-2xl bg-white text-neutral-900 font-semibold hover:bg-white/90 transition"
                >
                  Confirm Table
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

