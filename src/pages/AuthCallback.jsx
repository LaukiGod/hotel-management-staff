import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTenantNavigate, useTenant } from '../context/TenantContext'

export default function AuthCallback() {
  const { login } = useAuth()
  const navigate = useTenantNavigate()
  const { restaurant } = useTenant()
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    try {
      login(token)
      navigate('/admin/dashboard', { replace: true })
    } catch (e) {
      // The token is valid but was issued for a different restaurant — refuse it
      // rather than letting a session cross the tenant boundary.
      setError(e.message || 'This account does not belong to this restaurant')
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-6 text-center">
      {error ? (
        <div>
          <p className="text-red-400">{error}</p>
          <p className="mt-1 text-sm text-gray-500">{restaurant?.name}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="mt-4 text-sm text-gray-400 underline underline-offset-4 hover:text-gray-200"
          >
            Back to sign-in
          </button>
        </div>
      ) : (
        <p className="text-gray-400">Signing you in...</p>
      )}
    </div>
  )
}
