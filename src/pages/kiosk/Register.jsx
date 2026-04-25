import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { kioskAxios } from '../../api/kioskAxios'
import KioskShell from '../../components/KioskShell'
import { useKioskSession } from '../../context/KioskSessionContext'

const PRESET_ALLERGIES = ['nuts', 'gluten', 'dairy', 'shellfish', 'eggs', 'soy', 'sesame']

export default function KioskRegister() {
  const navigate = useNavigate()
  const location = useLocation()
  const { tableNo, user, allergies: sessionAllergies, detailsDraft, setUser, setAllergies, setDetailsDraft, resetForTableChange } = useKioskSession()
  const [name, setName] = useState(() => String(user?.name || detailsDraft?.name || ''))
  const [phoneNo, setPhoneNo] = useState(() => String(user?.phoneNo || detailsDraft?.phoneNo || ''))
  const [allergyInput, setAllergyInput] = useState('')
  const [allergies, setAllergyList] = useState(() =>
    Array.isArray(sessionAllergies) && sessionAllergies.length
      ? sessionAllergies
      : (Array.isArray(detailsDraft?.allergies) ? detailsDraft.allergies : [])
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const phoneValid = useMemo(() => /^\d{10}$/.test(phoneNo), [phoneNo])
  const canSubmit = useMemo(() => Boolean(tableNo) && name.trim().length >= 2 && phoneValid, [tableNo, name, phoneValid])

  useEffect(() => {
    if (!tableNo) navigate('/tables', { replace: true })
  }, [navigate, tableNo])

  const cancelTo = location.state?.from || '/tables'

  useEffect(() => {
    setDetailsDraft({ name, phoneNo, allergies })
  }, [name, phoneNo, allergies])

  async function changeTable() {
    setLoading(true)
    setError('')
    try {
      if (tableNo) {
        await kioskAxios.post('/user/clear-table', { tableNo: Number(tableNo) })
      }
    } catch {
      // Safe to ignore when table was never claimed or already free.
    } finally {
      resetForTableChange()
      setLoading(false)
      navigate('/tables')
    }
  }

  function addAllergy(value) {
    const v = String(value || '').trim().toLowerCase()
    if (!v) return
    setAllergyList((prev) => (prev.includes(v) ? prev : [...prev, v]))
    setAllergyInput('')
  }

  function removeAllergy(v) {
    setAllergyList((prev) => prev.filter((x) => x !== v))
  }

  async function submit(e) {
    e.preventDefault()
    if (!canSubmit) {
      if (!phoneValid) setError('Phone number must be exactly 10 digits.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const payload = {
        tableNo: Number(tableNo),
        name: name.trim(),
        phoneNo: phoneNo.trim(),
        allowExistingSession: cancelTo === '/menu',
      }

      // Step 1: claim table + create user
      const res = await kioskAxios.post('/user/login-table', payload)
      const createdUser = res.data?.user || { ...payload, allergies: [] }

      // Step 2: set allergies (also flags table allergyAlert)
      if (allergies.length) {
        const allergiesRes = await kioskAxios.post('/user/set-allergies', { tableNo: Number(tableNo), allergies })
        setUser(allergiesRes.data?.user || { ...createdUser, allergies })
      } else {
        setUser(createdUser)
      }

      setAllergies(allergies)
      navigate('/menu')
    } catch (e2) {
      setError(e2?.response?.data?.message || e2.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KioskShell>
      <div className="min-h-screen w-full flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-7">
          <p className="text-white/70 text-sm">Step 2 of 5</p>
          <h1 className="text-3xl font-extrabold mt-1">Your details</h1>
          <p className="mt-2 text-white/70 text-sm">Table #{tableNo} is pre-selected.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="Name" value={name} onChange={setName} placeholder="Your name" />
            <Field
              label="Phone number"
              value={phoneNo}
              onChange={(v) => setPhoneNo(String(v || '').replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit mobile"
              inputMode="numeric"
              type="tel"
              maxLength={10}
              hint={!phoneNo || phoneValid ? '' : 'Enter exactly 10 digits'}
            />

            <div>
              <label className="block text-xs text-white/70 mb-2">Allergies (optional)</label>

              <div className="flex flex-wrap gap-2 mb-3">
                {allergies.map((a) => (
                  <button
                    type="button"
                    key={a}
                    onClick={() => removeAllergy(a)}
                    className="px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-200 border border-amber-400/25 text-xs hover:bg-amber-500/25 transition"
                  >
                    {a} <span className="opacity-75">×</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  value={allergyInput}
                  onChange={(e) => setAllergyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addAllergy(allergyInput)
                    }
                  }}
                  placeholder="Type and press Enter (e.g. nuts)"
                  className="flex-1 h-12 rounded-2xl bg-black/30 border border-white/10 px-4 text-sm outline-none focus:border-white/25"
                />
                <button
                  type="button"
                  onClick={() => addAllergy(allergyInput)}
                  className="h-12 px-4 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 transition"
                >
                  Add
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {PRESET_ALLERGIES.map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => addAllergy(p)}
                    className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/75 hover:bg-white/10 transition"
                  >
                    + {p}
                  </button>
                ))}
              </div>
            </div>

            {error ? <p className="text-sm text-red-300">{error}</p> : null}

            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="w-full h-12 rounded-2xl bg-white text-neutral-900 font-semibold hover:bg-white/90 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {loading ? <Spinner /> : null}
              Continue to Menu
            </button>

            <button
              type="button"
              onClick={changeTable}
              disabled={loading}
              className="w-full text-sm text-white/70 hover:text-white transition-colors disabled:opacity-50"
            >
              Change table
            </button>

            <button
              type="button"
              onClick={() => navigate(cancelTo)}
              className="w-full text-sm text-white/70 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </form>
        </div>
      </div>
    </KioskShell>
  )
}

function Field({ label, value, onChange, placeholder, inputMode, type = 'text', maxLength, hint }) {
  return (
    <div>
      <label className="block text-xs text-white/70 mb-2">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        type={type}
        maxLength={maxLength}
        autoComplete="off"
        className="w-full h-12 rounded-2xl bg-black/30 border border-white/10 px-4 text-sm outline-none focus:border-white/25"
      />
      {hint ? <p className="mt-2 text-xs text-red-300">{hint}</p> : null}
    </div>
  )
}

function Spinner() {
  return (
    <span className="inline-block w-4 h-4 rounded-full border-2 border-neutral-900/30 border-t-neutral-900 animate-spin" />
  )
}

