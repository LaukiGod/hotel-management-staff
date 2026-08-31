import { useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AdminLayoutProvider } from './context/AdminLayoutContext'
import { TenantProvider, useTenant } from './context/TenantContext'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'
import Navbar from './components/Navbar'
import { KioskSessionProvider, useKioskSession } from './context/KioskSessionContext'
import { useAdminLayout } from './context/AdminLayoutContext'
import { useMediaQuery } from './hooks/useMediaQuery'
import { PopupProvider } from './context/PopupContext'
import { AnimatePresence } from 'framer-motion'
import { PLATFORM_SCOPE } from './config/api'

import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback'
import Dashboard from './pages/Dashboard'
import Tables from './pages/Tables'
import Orders from './pages/Orders'
import Alerts from './pages/Alerts'
import Inventory from './pages/Inventory'
import Menu from './pages/Menu'
import StaffManagement from './pages/StaffManagement'
import CustomerMenu from './pages/customer/CustomerMenu'
import CustomerTrack from './pages/customer/CustomerTrack'
import TableSelectEntry from './pages/customer/TableSelectEntry'
import KioskWelcome from './pages/kiosk/Welcome'
import KioskTables from './pages/kiosk/TableSelection'
import KioskOrderSuccess from './pages/kiosk/OrderSuccess'
import KioskOrderTracking from './pages/kiosk/KioskOrderTracking'
import KioskOrderFeedback from './pages/kiosk/KioskOrderFeedback'

import PlatformLogin from './pages/platform/PlatformLogin'
import PlatformAuthCallback from './pages/platform/PlatformAuthCallback'
import PlatformRestaurants from './pages/platform/PlatformRestaurants'
import PlatformRestaurantNew from './pages/platform/PlatformRestaurantNew'
import PlatformLayout from './pages/platform/PlatformLayout'
import NoRestaurant from './pages/NoRestaurant'

const KIOSK_PERSISTED_PATHS = new Set(['/tables', '/order-tracking', '/order-success'])

/**
 * Persists the current kiosk step so a return to the app root can restore it (see `getKioskResumePath` + `Welcome`).
 * Paths are stored tenant-relative, so the /r/:slug prefix is stripped first.
 */
function KioskPathSync() {
  const { setKioskPath } = useKioskSession()
  const { slug } = useTenant()
  const setKioskPathRef = useRef(setKioskPath)
  setKioskPathRef.current = setKioskPath
  const { pathname } = useLocation()

  useEffect(() => {
    const prefix = `/r/${slug}`
    const relative = pathname.startsWith(prefix) ? pathname.slice(prefix.length) || '/' : pathname
    if (KIOSK_PERSISTED_PATHS.has(relative)) {
      setKioskPathRef.current(relative)
    }
  }, [pathname, slug])
  return null
}

function AdminMain() {
  const { sidebarCollapsed, sidebarWidth } = useAdminLayout()
  const isLg = useMediaQuery('(min-width: 1024px)')
  const pad = isLg ? (sidebarCollapsed ? 72 : sidebarWidth) : 0
  return (
    <main
      className="min-h-0 w-full min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 transition-[padding] duration-150 ease-out"
      style={pad ? { paddingLeft: pad } : undefined}
    >
      <div className="flex min-h-full min-w-0 flex-1 flex-col">
        <Outlet />
      </div>
    </main>
  )
}

function AppLayout() {
  return (
    <AdminLayoutProvider>
      <div className="flex min-h-0 min-h-screen w-full min-w-0 flex-col bg-gray-100 supports-[min-height:100dvh]:min-h-[100dvh]">
        <Navbar />
        <AdminMain />
      </div>
    </AdminLayoutProvider>
  )
}

/**
 * Everything inside one restaurant. `TenantProvider` (the route element above
 * this) has already resolved :slug and pointed the API client at it, so the
 * auth session and kiosk state below are scoped to that restaurant.
 */
function TenantApp() {
  const { slug } = useTenant()

  return (
    <AuthProvider scope={slug}>
      <PopupProvider>
        <KioskSessionProvider>
          <KioskPathSync />
          <TenantRoutes />
        </KioskSessionProvider>
      </PopupProvider>
    </AuthProvider>
  )
}

/** Redirect to a path inside the current restaurant. */
function TenantRedirect({ to }) {
  const { slug } = useTenant()
  return <Navigate to={`/r/${slug}${to === '/' ? '' : to}`} replace />
}

function TenantRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Kiosk ordering flow */}
        <Route index element={<KioskWelcome />} />
        <Route path="tables" element={<KioskTables />} />
        <Route path="register" element={<TenantRedirect to="/tables" />} />
        <Route path="menu" element={<TenantRedirect to="/tables" />} />
        <Route path="order-tracking" element={<KioskOrderTracking />} />
        <Route path="order-feedback" element={<KioskOrderFeedback />} />
        <Route path="order-success" element={<KioskOrderSuccess />} />

        {/* Staff/Admin auth */}
        <Route path="login" element={<Login />} />
        <Route path="auth/callback" element={<AuthCallback />} />

        {/* Legacy customer login route (no longer used) */}
        <Route path="customer/login" element={<TenantRedirect to="/tables" />} />
        <Route path="user/table-select/:tableId" element={<TableSelectEntry />} />
        <Route path="customer/menu" element={<CustomerMenu />} />
        <Route path="customer/track" element={<CustomerTrack />} />

        {/* Staff/Admin protected — shared layout */}
        <Route path="admin" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="tables"    element={<Tables />} />
          <Route path="orders"    element={<Orders />} />
          <Route path="alerts"    element={<Alerts />} />
          <Route path="inventory" element={<Inventory />} />

          {/* Admin only */}
          <Route path="menu"  element={<RoleRoute role="ADMIN"><Menu /></RoleRoute>} />
          <Route path="staff" element={<RoleRoute role="ADMIN"><StaffManagement /></RoleRoute>} />
        </Route>

        {/* Catch-all inside a tenant */}
        <Route path="*" element={<TenantRedirect to="/" />} />
      </Routes>
    </AnimatePresence>
  )
}

/** SUPER_ADMIN console — belongs to no restaurant, so no TenantProvider. */
function PlatformApp() {
  return (
    <AuthProvider scope={PLATFORM_SCOPE}>
      <PopupProvider>
        <Routes>
          <Route path="login" element={<PlatformLogin />} />
          <Route path="auth/callback" element={<PlatformAuthCallback />} />
          <Route element={<PlatformLayout />}>
            <Route index element={<Navigate to="restaurants" replace />} />
            <Route path="restaurants" element={<PlatformRestaurants />} />
            <Route path="restaurants/new" element={<PlatformRestaurantNew />} />
          </Route>
          <Route path="*" element={<Navigate to="/platform/restaurants" replace />} />
        </Routes>
      </PopupProvider>
    </AuthProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Platform console */}
        <Route path="/platform/*" element={<PlatformApp />} />

        {/* One restaurant, resolved from :slug */}
        <Route path="/r/:slug" element={<TenantProvider />}>
          <Route path="*" element={<TenantApp />} />
        </Route>

        {/* No restaurant in the URL — nothing to show. This app is deliberately
            not a directory of restaurants; each tenant is reached by its own link. */}
        <Route path="/" element={<NoRestaurant />} />
        <Route path="*" element={<NoRestaurant />} />
      </Routes>
    </BrowserRouter>
  )
}
