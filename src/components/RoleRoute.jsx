import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RoleRoute({ role, children }) {
  const { user } = useAuth()
  if (user?.role !== role) return <Navigate to="/dashboard" replace />
  return children
}
