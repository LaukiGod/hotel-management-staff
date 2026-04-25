import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAdminLayout } from '../context/AdminLayoutContext'

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/admin/tables', label: 'Tables', icon: 'tables' },
  { to: '/admin/orders', label: 'Orders', icon: 'orders' },
  { to: '/admin/alerts', label: 'Allergy Alerts', icon: 'alerts' },
  { to: '/admin/inventory', label: 'Inventory', icon: 'inventory' },
]

const adminItems = [
  { to: '/admin/menu', label: 'Menu', icon: 'menu' },
  { to: '/admin/staff', label: 'Staff', icon: 'staff' },
]

const iconClass = 'shrink-0 w-5 h-5'

function NavIcon({ name }) {
  switch (name) {
    case 'dashboard':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5L12 3l9 7.5M5 10v10h14V10" />
        </svg>
      )
    case 'tables':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h5v5H4V5zm11 0h5v5h-5V5zM4 14h5v5H4v-5zm11 0h5v5h-5v-5z" />
        </svg>
      )
    case 'orders':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 4h8v2H8V4zm-2 3h12v3H6V7zm0 4h12v8a2 2 0 01-2 2H8a2 2 0 01-2-2v-8zm4 2v4h2v-4h-2z" />
        </svg>
      )
    case 'alerts':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      )
    case 'inventory':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    case 'menu':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h10M4 18h16M4 14h6" />
        </svg>
      )
    case 'staff':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4a3 3 0 100 6 3 3 0 000-6zM4 20a8 8 0 1116 0" />
        </svg>
      )
    default:
      return <span className={iconClass} />
  }
}

function itemClass(collapsed) {
  return function navItemClassName({ isActive }) {
    return [
      'flex items-center gap-3 rounded-md text-sm transition-colors min-h-[2.5rem]',
      collapsed ? 'justify-center px-2 py-2' : 'px-3 py-2',
      isActive ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white',
    ].join(' ')
  }
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const {
    mobileNavOpen,
    setMobileNavOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
    sidebarWidth,
    setSidebarWidth,
  } = useAdminLayout()
  const [isResizing, setIsResizing] = useState(false)
  const resizeRef = useRef({ startX: 0, startW: 0 })

  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname, setMobileNavOpen])

  function handleLogout() {
    logout()
    setMobileNavOpen(false)
    navigate('/login')
  }

  return (
    <div className="flex w-full shrink-0 flex-col lg:w-auto lg:shrink-0 lg:self-stretch">
      <header className="flex h-14 min-h-14 shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-3 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] shadow-sm [padding-top:max(0.25rem,env(safe-area-inset-top))] lg:hidden">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-800 hover:bg-gray-100 active:bg-gray-200"
          aria-label="Open menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold leading-tight text-gray-900">Restaurant</p>
          <p className="truncate text-xs text-gray-500">
            Manager{user?.role ? ` · ${user.role}` : ''}
          </p>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">
          {(user?.name || user?.email || '?')
            .toString()
            .slice(0, 1)
            .toUpperCase()}
        </div>
      </header>

      {mobileNavOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden
        />
      ) : null}

      <aside
        className={[
          'lg:hidden fixed z-50 top-0 left-0 flex h-full w-full max-w-[min(20rem,88vw)] flex-col bg-gray-900 text-gray-200 shadow-2xl transition-transform duration-200 ease-out',
          'pl-[max(0px,env(safe-area-inset-left))] pt-[env(safe-area-inset-top)]',
          mobileNavOpen ? 'translate-x-0' : 'pointer-events-none -translate-x-full',
        ].join(' ')}
        id="admin-mobile-nav"
        aria-hidden={!mobileNavOpen}
      >
        <div className="flex items-center justify-between gap-2 border-b border-gray-700 px-4 py-4">
          <div className="min-w-0">
            <p className="truncate text-lg font-bold leading-tight text-white">Restaurant</p>
            <p className="mt-0.5 text-xs text-gray-400">Manager</p>
          </div>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white"
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 py-4">
          {navItems.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} onClick={() => setMobileNavOpen(false)} className={itemClass(false)}>
              <NavIcon name={icon} />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
          {user?.role === 'ADMIN' && (
            <>
              <p className="px-3 pb-1 pt-4 text-xs uppercase tracking-wider text-gray-500">Admin</p>
              {adminItems.map(({ to, label, icon }) => (
                <NavLink key={to} to={to} onClick={() => setMobileNavOpen(false)} className={itemClass(false)}>
                  <NavIcon name={icon} />
                  <span className="truncate">{label}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>
        <div className="space-y-2 border-t border-gray-700 px-4 py-4">
          <p className="truncate text-sm font-medium text-white">{user?.name}</p>
          <p className="truncate text-xs text-gray-400">{user?.email}</p>
          <span className="inline-block rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-300">{user?.role}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-1 w-full py-2 text-left text-xs text-gray-400 transition-colors hover:text-white"
          >
            Sign out →
          </button>
        </div>
      </aside>

      <aside
        className="fixed left-0 top-0 z-40 hidden h-screen min-h-0 flex-col overflow-hidden border-r border-gray-800 bg-gray-900 text-gray-200 supports-[min-height:100dvh]:h-[100dvh] lg:flex"
        style={{
          width: sidebarCollapsed ? 72 : sidebarWidth,
          transition: isResizing ? 'none' : 'width 0.15s ease',
        }}
      >
        {!sidebarCollapsed ? (
          <div
            className="group absolute right-0 top-0 z-20 flex w-1.5 cursor-col-resize justify-center hover:bg-sky-500/40"
            onPointerDown={(e) => {
              e.preventDefault()
              if (sidebarCollapsed) return
              setIsResizing(true)
              const startW = sidebarWidth
              const startX = e.clientX
              resizeRef.current = { startX, startW }
              const el = e.currentTarget
              el.setPointerCapture(e.pointerId)
              const onMove = (ev) => {
                const { startX: sx, startW: sw } = resizeRef.current
                const next = sw + (ev.clientX - sx)
                setSidebarWidth(Math.min(400, Math.max(200, next)))
              }
              const onUp = (ev) => {
                try {
                  if (el.hasPointerCapture?.(ev.pointerId)) {
                    el.releasePointerCapture(ev.pointerId)
                  }
                } catch {
                  // ignore
                }
                setIsResizing(false)
                window.removeEventListener('pointermove', onMove)
                window.removeEventListener('pointerup', onUp)
                window.removeEventListener('pointercancel', onUp)
              }
              window.addEventListener('pointermove', onMove)
              window.addEventListener('pointerup', onUp)
              window.addEventListener('pointercancel', onUp)
            }}
            title="Drag to resize"
            role="separator"
            aria-orientation="vertical"
          />
        ) : null}

        <div className="flex min-h-[3.5rem] items-center justify-between gap-1 border-b border-gray-700 px-3 py-3">
          <div className={sidebarCollapsed ? 'sr-only' : 'min-w-0 flex-1 pl-0.5'}>
            <p className="truncate text-sm font-bold leading-tight text-white">Restaurant</p>
            <p className="text-[10px] text-gray-400">Manager</p>
          </div>
          <button
            type="button"
            onClick={() => setSidebarCollapsed((c) => !c)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
            title={sidebarCollapsed ? 'Expand menu' : 'Collapse menu'}
            aria-expanded={!sidebarCollapsed}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              {sidebarCollapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 5l-7 7 7 7" />
              )}
            </svg>
          </button>
        </div>

        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden px-2 py-3">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin/dashboard'}
              title={sidebarCollapsed ? label : undefined}
              className={itemClass(sidebarCollapsed)}
            >
              <NavIcon name={icon} />
              {!sidebarCollapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
          {user?.role === 'ADMIN' && (
            <>
              {sidebarCollapsed ? <div className="mx-1 my-2 h-px bg-gray-700" aria-hidden /> : null}
              {!sidebarCollapsed ? (
                <p className="px-3 pb-1 pt-4 text-[10px] uppercase tracking-wider text-gray-500">Admin</p>
              ) : null}
              {adminItems.map(({ to, label, icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  title={sidebarCollapsed ? label : undefined}
                  className={itemClass(sidebarCollapsed)}
                >
                  <NavIcon name={icon} />
                  {!sidebarCollapsed && <span className="truncate">{label}</span>}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div
          className={
            sidebarCollapsed
              ? 'flex flex-col items-center gap-1 border-t border-gray-700 p-2'
              : 'space-y-1 border-t border-gray-700 px-3 py-3'
          }
        >
          {!sidebarCollapsed ? (
            <>
              <p className="w-full truncate text-xs font-medium text-white">{user?.name}</p>
              <p className="w-full truncate text-[10px] text-gray-400">{user?.email}</p>
            </>
          ) : null}
          <span
            className={
              sidebarCollapsed
                ? 'text-[9px] text-gray-400'
                : 'inline-block rounded bg-gray-700 px-2 py-0.5 text-[10px] text-gray-300'
            }
            title={user?.role}
          >
            {sidebarCollapsed ? (user?.role || '').slice(0, 1) : user?.role}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className={
              sidebarCollapsed
                ? 'mt-1 text-[10px] text-gray-400 hover:text-white'
                : 'w-full text-left text-[10px] text-gray-400 transition-colors hover:text-white'
            }
            title="Sign out"
          >
            {sidebarCollapsed ? '⎋' : 'Sign out →'}
          </button>
        </div>
      </aside>
    </div>
  )
}
