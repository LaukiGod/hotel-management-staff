import { useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AdminLayoutProvider } from './context/AdminLayoutContext'
import { ToastProvider } from './context/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'
import Navbar from './components/Navbar'
import { KioskSessionProvider, useKioskSession } from './context/KioskSessionContext'
import { useAdminLayout } from './context/AdminLayoutContext'
import { useMediaQuery } from './hooks/useMediaQuery'
import { AnimatePresence } from 'framer-motion'

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

const KIOSK_PERSISTED_PATHS = new Set(['/tables', '/order-tracking', '/order-success'])

/**
 * Persists the current kiosk step so a return to the app root can restore it (see `getKioskResumePath` + `Welcome`).
 */
function KioskPathSync() {
  const { setKioskPath } = useKioskSession()
  const setKioskPathRef = useRef(setKioskPath)
  setKioskPathRef.current = setKioskPath
  const { pathname } = useLocation()

  useEffect(() => {
    if (KIOSK_PERSISTED_PATHS.has(pathname)) {
      setKioskPathRef.current(pathname)
    }
  }, [pathname])
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

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Kiosk ordering flow */}
        <Route path="/" element={<KioskWelcome />} />
        <Route path="/tables" element={<KioskTables />} />
        <Route path="/register" element={<Navigate to="/tables" replace />} />
        <Route path="/menu" element={<Navigate to="/tables" replace />} />
        <Route path="/order-tracking" element={<KioskOrderTracking />} />
        <Route path="/order-feedback" element={<KioskOrderFeedback />} />
        <Route path="/order-success" element={<KioskOrderSuccess />} />

        {/* Staff/Admin auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Legacy customer login route (no longer used) */}
        <Route path="/customer/login" element={<Navigate to="/tables" replace />} />
        <Route path="/user/table-select/:tableId" element={<TableSelectEntry />} />
        <Route path="/customer/menu" element={<CustomerMenu />} />
        <Route path="/customer/track" element={<CustomerTrack />} />

        {/* Staff/Admin protected — shared layout */}
        <Route path="/admin" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
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

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <KioskSessionProvider>
          <BrowserRouter>
            <KioskPathSync />
            <AnimatedRoutes />
          </BrowserRouter>
        </KioskSessionProvider>
      </AuthProvider>
    </ToastProvider>
  )
}
