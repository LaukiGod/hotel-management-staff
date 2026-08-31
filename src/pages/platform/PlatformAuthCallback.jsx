import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function PlatformAuthCallback() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token')
    if (!token) {
      navigate('/platform/login', { replace: true })
      return
    }
    try {
      login(token)
      navigate('/platform/restaurants', { replace: true })
    } catch (e) {
      // Token was issued for a restaurant, not the platform.
      setError(e.message || 'That account is not a platform administrator')
    }
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-6 text-center">
      {error ? (
        <div>
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => navigate('/platform/login', { replace: true })}
            className="mt-4 text-sm text-gray-400 underline underline-offset-4"
          >
            Back to sign-in
          </button>
        </div>
      ) : (
        <p className="text-gray-400">Signing you in…</p>
      )}
    </div>
  )
}
