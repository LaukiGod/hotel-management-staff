import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTenant } from '../context/TenantContext'

export default function ProtectedRoute({ children }) {
  const { token } = useAuth()
  const { slug } = useTenant()
  if (!token) return <Navigate to={`/r/${slug}/login`} replace />
  return children
}
