import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getToken, setToken as persistToken, clearToken } from '../api/client'
import { PLATFORM_SCOPE } from '../config/api'

const AuthContext = createContext(null)

function decodeJWT(token) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

/**
 * A token is only valid for the scope it was issued for. A staff token for
 * restaurant A must not authenticate a session at restaurant B, and a tenant
 * token must never satisfy the platform console.
 */
function tokenMatchesScope(decoded, scope) {
  if (!decoded) return false
  if (scope === PLATFORM_SCOPE) return decoded.role === 'SUPER_ADMIN'
  // SUPER_ADMIN may operate inside any restaurant.
  if (decoded.role === 'SUPER_ADMIN') return true
  return decoded.restaurantSlug === scope
}

/**
 * @param {{scope: string}} props `scope` is the restaurant slug, or PLATFORM_SCOPE.
 */
export function AuthProvider({ scope, children }) {
  const read = () => {
    const t = getToken(scope)
    if (!t) return { token: null, user: null }
    const decoded = decodeJWT(t)
    if (!tokenMatchesScope(decoded, scope)) {
      // Stale token from another restaurant — drop it rather than half-trusting it.
      clearToken(scope)
      return { token: null, user: null }
    }
    return { token: t, user: decoded }
  }

  const [state, setState] = useState(read)

  // Switching restaurants in the same tab must swap the session, not keep it.
  useEffect(() => {
    setState(read())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope])

  const value = useMemo(() => {
    function login(newToken) {
      const decoded = decodeJWT(newToken)
      if (!tokenMatchesScope(decoded, scope)) {
        throw new Error('This account does not belong to this restaurant')
      }
      persistToken(scope, newToken)
      setState({ token: newToken, user: decoded })
    }

    function logout() {
      clearToken(scope)
      setState({ token: null, user: null })
    }

    return { ...state, scope, login, logout }
  }, [state, scope])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
