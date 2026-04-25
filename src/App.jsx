import { useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'
import Navbar from './components/Navbar'
import { KioskSessionProvider, useKioskSession } from './context/KioskSessionContext'
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
import CustomerLogin from './pages/customer/CustomerLogin'
import CustomerMenu from './pages/customer/CustomerMenu'
import CustomerTrack from './pages/customer/CustomerTrack'
import KioskWelcome from './pages/kiosk/Welcome'
import KioskTables from './pages/kiosk/TableSelection'
import KioskRegister from './pages/kiosk/Register'
import KioskMenu from './pages/kiosk/Menu'
import KioskPayment from './pages/kiosk/Payment'
import KioskOrderSuccess from './pages/kiosk/OrderSuccess'

const KIOSK_PERSISTED_PATHS = new Set(['/tables', '/register', '/menu', '/payment', '/order-success'])

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

function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <Navbar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <>
      <KioskPathSync />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
        {/* Kiosk ordering flow */}
        <Route path="/" element={<KioskWelcome />} />
        <Route path="/tables" element={<KioskTables />} />
        <Route path="/register" element={<KioskRegister />} />
        <Route path="/menu" element={<KioskMenu />} />
        <Route path="/payment" element={<KioskPayment />} />
        <Route path="/order-success" element={<KioskOrderSuccess />} />

        {/* Staff/Admin auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Legacy customer routes (kept for compatibility) */}
        <Route path="/customer/login" element={<CustomerLogin />} />
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
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <KioskSessionProvider>
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </KioskSessionProvider>
    </AuthProvider>
  )
}
