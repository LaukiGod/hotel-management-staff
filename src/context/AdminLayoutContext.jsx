import { createContext, useContext, useEffect, useState } from 'react'

const CTX = createContext(null)

const LS_WIDTH = 'adminNav.sidebarWidth'
const LS_COLLAPSE = 'adminNav.collapsed'

function readWidth() {
  if (typeof window === 'undefined') return 256
  const w = parseInt(localStorage.getItem(LS_WIDTH) || '256', 10)
  return Number.isFinite(w) && w >= 200 && w <= 400 ? w : 256
}

function readCollapsed() {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(LS_COLLAPSE) === '1'
}

export function AdminLayoutProvider({ children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readCollapsed)
  const [sidebarWidth, setSidebarWidth] = useState(readWidth)

  useEffect(() => {
    try {
      localStorage.setItem(LS_COLLAPSE, sidebarCollapsed ? '1' : '0')
    } catch {
      // ignore
    }
  }, [sidebarCollapsed])

  useEffect(() => {
    try {
      localStorage.setItem(LS_WIDTH, String(Math.round(sidebarWidth)))
    } catch {
      // ignore
    }
  }, [sidebarWidth])

  const value = {
    mobileNavOpen,
    setMobileNavOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
    sidebarWidth,
    setSidebarWidth,
  }
  return <CTX.Provider value={value}>{children}</CTX.Provider>
}

export function useAdminLayout() {
  const v = useContext(CTX)
  if (!v) {
    return {
      mobileNavOpen: false,
      setMobileNavOpen: () => {},
      sidebarCollapsed: false,
      setSidebarCollapsed: () => {},
      sidebarWidth: 256,
      setSidebarWidth: () => {},
    }
  }
  return v
}
