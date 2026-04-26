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
        kioskPath: typeof parsed.kioskPath === 'string' ? parsed.kioskPath : null,
        allergies: Array.isArray(parsed.allergies) ? parsed.allergies : [],
        detailsDraft: parsed.detailsDraft && typeof parsed.detailsDraft === 'object'
          ? {
              name: String(parsed.detailsDraft.name || ''),
              phoneNo: String(parsed.detailsDraft.phoneNo || ''),
              allergies: Array.isArray(parsed.detailsDraft.allergies) ? parsed.detailsDraft.allergies : [],
            }
          : { name: '', phoneNo: '', allergies: [] },
      }
    : { tableNo: null, user: null, cart: [], orderId: null, kioskPath: null, allergies: [], detailsDraft: { name: '', phoneNo: '', allergies: [] } }
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

    function setKioskPath(kioskPath) {
      persist((prev) => ({ ...prev, kioskPath: kioskPath == null ? null : String(kioskPath) }))
    }

    function setDetailsDraft(detailsDraft) {
      const next = detailsDraft && typeof detailsDraft === 'object' ? detailsDraft : {}
      persist((prev) => ({
        ...prev,
        detailsDraft: {
          name: String(next.name ?? prev.detailsDraft?.name ?? ''),
          phoneNo: String(next.phoneNo ?? prev.detailsDraft?.phoneNo ?? ''),
          allergies: Array.isArray(next.allergies) ? next.allergies : (prev.detailsDraft?.allergies || []),
        },
      }))
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
      const next = { tableNo: null, user: null, cart: [], orderId: null, kioskPath: null, allergies: [], detailsDraft: { name: '', phoneNo: '', allergies: [] } }
      setState(next)
      localStorage.removeItem(STORAGE_KEY)
    }

    function resetForTableChange() {
      persist((prev) => ({
        tableNo: null,
        user: null,
        cart: [],
        orderId: null,
        kioskPath: null,
        allergies: [],
        detailsDraft: prev.detailsDraft || { name: '', phoneNo: '', allergies: [] },
      }))
    }

    return {
      ...state,
      setTableNo,
      setUser,
      setAllergies,
      setOrderId,
      setKioskPath,
      setDetailsDraft,
      setQty,
      setCart,
      resetSession,
      resetForTableChange,
    }
  }, [state])

  return <KioskSessionContext.Provider value={api}>{children}</KioskSessionContext.Provider>
}

export function useKioskSession() {
  const ctx = useContext(KioskSessionContext)
  if (!ctx) throw new Error('useKioskSession must be used within KioskSessionProvider')
  return ctx
}

