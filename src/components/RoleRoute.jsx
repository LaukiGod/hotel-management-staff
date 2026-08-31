import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTenant } from '../context/TenantContext'

export default function RoleRoute({ role, children }) {
  const { user } = useAuth()
  const { slug } = useTenant()
  // SUPER_ADMIN inspecting a tenant keeps full access.
  const allowed = user?.role === role || user?.role === 'SUPER_ADMIN'
  if (!allowed) return <Navigate to={`/r/${slug}/admin/dashboard`} replace />
  return children
}
