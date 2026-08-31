import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

/** Shell for the SUPER_ADMIN console, and the gate that keeps everyone else out. */
export default function PlatformLayout() {
  const { token, user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) navigate('/platform/login', { replace: true })
  }, [token, navigate])

  if (!token) return null

  const linkClass = ({ isActive }) =>
    `rounded-md px-3 py-2 text-sm font-medium transition ${
      isActive ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'
    }`

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600">Platform</p>
            <h1 className="text-lg font-semibold text-white">Restaurants</h1>
          </div>

          <nav className="flex items-center gap-1">
            <NavLink to="/platform/restaurants" end className={linkClass}>
              All restaurants
            </NavLink>
            <NavLink to="/platform/restaurants/new" className={linkClass}>
              Add restaurant
            </NavLink>
          </nav>

          <div className="ml-auto flex items-center gap-4">
            <span className="hidden text-sm text-gray-500 sm:block">{user?.email}</span>
            <button
              onClick={() => {
                logout()
                navigate('/platform/login', { replace: true })
              }}
              className="rounded-md border border-gray-700 px-3 py-1.5 text-sm text-gray-300 transition hover:bg-gray-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
