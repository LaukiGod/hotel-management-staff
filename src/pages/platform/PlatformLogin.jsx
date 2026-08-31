import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { oauthStartUrl, PLATFORM_SCOPE } from '../../config/api'

export default function PlatformLogin() {
  const { token } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (token) navigate('/platform/restaurants', { replace: true })
  }, [token, navigate])

  function signIn() {
    window.location.href = oauthStartUrl(PLATFORM_SCOPE)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-6">
      <div className="w-full max-w-sm rounded-xl border border-gray-800 bg-gray-800/50 p-8 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Platform</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Administrator sign-in</h1>
        <p className="mt-3 text-sm text-gray-400">
          Manage every restaurant on this deployment. Restricted to platform administrators.
        </p>

        <button
          onClick={signIn}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-lg bg-white px-4 py-3 font-medium text-gray-800 transition hover:bg-gray-100"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0012 23z" />
            <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 010-4.22V7.05H2.18a11 11 0 000 9.9l3.66-2.84z" />
            <path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 002.18 7.05l3.66 2.84c.87-2.6 3.3-4.14 6.16-4.14z" />
          </svg>
          Continue with Google
        </button>

        <p className="mt-6 text-xs text-gray-600">
          Restaurant staff sign in at their own restaurant address instead.
        </p>
      </div>
    </div>
  )
}
