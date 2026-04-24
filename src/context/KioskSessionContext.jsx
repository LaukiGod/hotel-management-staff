import { createContext, useContext, useMemo, useState } from 'react'

const STORAGE_KEY = 'smart-restaurant-kiosk-session-v1'

function safeParse(json) {
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

function loadInitial() {
  const raw = localStorage.getItem(STORAGE_KEY)
  const parsed = raw ? safeParse(raw) : null
  return parsed && typeof parsed === 'object'
    ? {
        tableNo: parsed.tableNo ?? null,
        user: parsed.user ?? null,
        cart: Array.isArray(parsed.cart) ? parsed.cart : [],
        orderId: parsed.orderId ?? null,
        allergies: Array.isArray(parsed.allergies) ? parsed.allergies : [],
      }
    : { tableNo: null, user: null, cart: [], orderId: null, allergies: [] }
}

const KioskSessionContext = createContext(null)

export function KioskSessionProvider({ children }) {
  const [state, setState] = useState(loadInitial)

  function persist(updater) {
    setState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const api = useMemo(() => {
    function setTableNo(tableNo) {
      persist((prev) => ({ ...prev, tableNo }))
    }

    function setUser(user) {
      persist((prev) => ({ ...prev, user }))
    }

    function setAllergies(allergies) {
      persist((prev) => ({ ...prev, allergies }))
    }

    function setOrderId(orderId) {
      persist((prev) => ({ ...prev, orderId }))
    }

    function setCart(cart) {
      persist((prev) => ({ ...prev, cart }))
    }

    function setQty(dish, qty) {
      const nextQty = Math.max(0, Number(qty) || 0)
      const idKey = dish?.dishId || dish?._id
      persist((prev) => {
        const next = (prev.cart || [])
          .filter((i) => (i.dish?.dishId || i.dish?._id) !== idKey)
          .concat(nextQty > 0 ? [{ dish, qty: nextQty }] : [])
        return { ...prev, cart: next }
      })
    }

    function resetSession() {
      const next = { tableNo: null, user: null, cart: [], orderId: null, allergies: [] }
      setState(next)
      localStorage.removeItem(STORAGE_KEY)
    }

    return {
      ...state,
      setTableNo,
      setUser,
      setAllergies,
      setOrderId,
      setQty,
      setCart,
      resetSession,
    }
  }, [state])

  return <KioskSessionContext.Provider value={api}>{children}</KioskSessionContext.Provider>
}

export function useKioskSession() {
  const ctx = useContext(KioskSessionContext)
  if (!ctx) throw new Error('useKioskSession must be used within KioskSessionProvider')
  return ctx
}

