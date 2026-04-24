import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/tables',    label: 'Tables' },
  { to: '/admin/orders',    label: 'Orders' },
  { to: '/admin/alerts',    label: 'Allergy Alerts' },
  { to: '/admin/inventory', label: 'Inventory' },
]

const adminItems = [
  { to: '/admin/menu',  label: 'Menu' },
  { to: '/admin/staff', label: 'Staff' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-gray-200 flex flex-col shrink-0">
      <div className="px-5 py-5 border-b border-gray-700">
        <p className="text-white font-bold text-lg leading-tight">Restaurant</p>
        <p className="text-gray-400 text-xs mt-0.5">Manager</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-sm transition-colors ${
                isActive ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            {label}
          </NavLink>
        ))}

        {user?.role === 'ADMIN' && (
          <>
            <p className="px-3 pt-4 pb-1 text-xs text-gray-500 uppercase tracking-wider">Admin</p>
            {adminItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="px-4 py-4 border-t border-gray-700">
        <p className="text-sm text-white font-medium truncate">{user?.name}</p>
        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
        <span className="inline-block mt-1 px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-300">{user?.role}</span>
        <button
          onClick={handleLogout}
          className="mt-3 w-full text-xs text-gray-400 hover:text-white transition-colors text-left"
        >
          Sign out →
        </button>
      </div>
    </aside>
  )
}
