import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

function decodeJWT(token) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem('token'))
  const [user, setUser] = useState(() => {
    const t = sessionStorage.getItem('token')
    return t ? decodeJWT(t) : null
  })

  function login(newToken) {
    const decoded = decodeJWT(newToken)
    sessionStorage.setItem('token', newToken)
    setToken(newToken)
    setUser(decoded)
  }

  function logout() {
    sessionStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
