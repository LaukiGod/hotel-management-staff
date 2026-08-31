import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { platformApi } from '../../api/client'

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-300">{label}</span>
      {hint && <span className="mt-0.5 block text-xs text-gray-500">{hint}</span>}
      <div className="mt-2">{children}</div>
    </label>
  )
}

const inputClass =
  'w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white outline-none transition focus:border-gray-500'

export default function PlatformRestaurantNew() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    slug: '',
    adminName: '',
    adminEmail: '',
    tableCount: 10,
    phone: '',
    address: '',
    currency: 'NPR',
    seedMenu: true,
  })
  const [slugTouched, setSlugTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState(null)

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // Slug follows the name until the operator edits it directly.
  const effectiveSlug = slugTouched ? slugify(form.slug) : slugify(form.name)

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await platformApi.post('/restaurants', {
        ...form,
        slug: effectiveSlug || undefined,
        tableCount: Number(form.tableCount),
      })
      setCreated(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (created) {
    const { restaurant, seeded } = created
    const origin = window.location.origin
    return (
      <div className="max-w-2xl">
        <h2 className="text-2xl font-semibold text-white">{restaurant.name} is live</h2>
        <p className="mt-2 text-gray-400">
          Seeded {seeded.tables} table(s) and {seeded.dishes} dish(es).
          {seeded.admin ? ` ${seeded.admin} can now sign in as ADMIN.` : ' No admin was invited yet.'}
        </p>

        <div className="mt-6 space-y-3">
          {[
            ['Staff & admin panel', `${origin}/r/${restaurant.slug}/admin/dashboard`],
            ['Staff sign-in', `${origin}/r/${restaurant.slug}/login`],
            ['Kiosk / tablet', `${origin}/r/${restaurant.slug}`],
          ].map(([label, url]) => (
            <div key={label} className="rounded-lg border border-gray-800 bg-gray-800/40 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block break-all text-sm text-gray-200 underline underline-offset-4"
              >
                {url}
              </a>
            </div>
          ))}
        </div>

        <p className="mt-6 text-sm text-gray-500">
          Table QR codes are generated from the staff panel under Tables, and encode this
          restaurant&apos;s address automatically.
        </p>

        <div className="mt-8 flex gap-3">
          <button
            onClick={() => navigate('/platform/restaurants')}
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-900"
          >
            Back to all restaurants
          </button>
          <button
            onClick={() => {
              setCreated(null)
              setForm({
                name: '', slug: '', adminName: '', adminEmail: '', tableCount: 10,
                phone: '', address: '', currency: 'NPR', seedMenu: true,
              })
              setSlugTouched(false)
            }}
            className="rounded-md border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
          >
            Add another
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Add a restaurant</h2>
        <p className="mt-1 text-sm text-gray-400">
          Creates an isolated tenant with its own tables, menu, staff and orders.
        </p>
      </div>

      {error && (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <Field label="Restaurant name">
        <input required value={form.name} onChange={set('name')} className={inputClass} placeholder="Bella Vista" />
      </Field>

      <Field label="Address slug" hint="Used in every URL and QR code for this restaurant.">
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-sm text-gray-500">{window.location.origin}/r/</span>
          <input
            value={slugTouched ? form.slug : effectiveSlug}
            onChange={(e) => {
              setSlugTouched(true)
              set('slug')(e)
            }}
            className={inputClass}
            placeholder="bella-vista"
          />
        </div>
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Owner name" hint="Becomes this restaurant's first ADMIN.">
          <input value={form.adminName} onChange={set('adminName')} className={inputClass} placeholder="Asha Rai" />
        </Field>
        <Field label="Owner Google email" hint="They sign in with this Google account.">
          <input
            type="email"
            value={form.adminEmail}
            onChange={set('adminEmail')}
            className={inputClass}
            placeholder="owner@bellavista.com"
          />
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <Field label="Tables">
          <input
            type="number"
            min="1"
            max="500"
            value={form.tableCount}
            onChange={set('tableCount')}
            className={inputClass}
          />
        </Field>
        <Field label="Currency">
          <input value={form.currency} onChange={set('currency')} className={inputClass} />
        </Field>
        <Field label="Phone">
          <input value={form.phone} onChange={set('phone')} className={inputClass} />
        </Field>
      </div>

      <Field label="Address">
        <input value={form.address} onChange={set('address')} className={inputClass} />
      </Field>

      <label className="flex items-start gap-3 rounded-lg border border-gray-800 bg-gray-800/40 p-4">
        <input type="checkbox" checked={form.seedMenu} onChange={set('seedMenu')} className="mt-0.5" />
        <span>
          <span className="block text-sm font-medium text-gray-200">Seed a starter menu</span>
          <span className="block text-xs text-gray-500">
            Copies the sample dish list so the restaurant is usable immediately. Uncheck to start empty.
          </span>
        </span>
      </label>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving || !form.name.trim()}
          className="rounded-md bg-white px-5 py-2.5 text-sm font-medium text-gray-900 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? 'Creating…' : 'Create restaurant'}
        </button>
        <button
          type="button"
          onClick={() => navigate('/platform/restaurants')}
          className="rounded-md px-4 py-2.5 text-sm text-gray-400 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
