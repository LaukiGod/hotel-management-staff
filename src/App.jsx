import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'
import Navbar from './components/Navbar'

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

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/customer/login" element={<CustomerLogin />} />
          <Route path="/customer/menu" element={<CustomerMenu />} />
          <Route path="/customer/track" element={<CustomerTrack />} />

          {/* Protected — shared layout */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tables"    element={<Tables />} />
            <Route path="/orders"    element={<Orders />} />
            <Route path="/alerts"    element={<Alerts />} />
            <Route path="/inventory" element={<Inventory />} />

            {/* Admin only */}
            <Route path="/menu"  element={<RoleRoute role="ADMIN"><Menu /></RoleRoute>} />
            <Route path="/staff" element={<RoleRoute role="ADMIN"><StaffManagement /></RoleRoute>} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
