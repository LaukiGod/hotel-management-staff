import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const PopupContext = createContext(null)

function toneClass(tone) {
  if (tone === 'success') return 'border-emerald-200 bg-emerald-50 text-emerald-900'
  if (tone === 'error') return 'border-red-200 bg-red-50 text-red-900'
  return 'border-gray-200 bg-white text-gray-900'
}

export function PopupProvider({ children }) {
  const [items, setItems] = useState([])

  const remove = useCallback((id) => {
    setItems((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const push = useCallback((message, tone = 'info', durationMs = 3200) => {
    const text = String(message || '').trim()
    if (!text) return
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setItems((prev) => [...prev, { id, text, tone }])
    window.setTimeout(() => remove(id), durationMs)
  }, [remove])

  const value = useMemo(
    () => ({
      info: (message, durationMs) => push(message, 'info', durationMs),
      success: (message, durationMs) => push(message, 'success', durationMs),
      error: (message, durationMs) => push(message, 'error', durationMs),
    }),
    [push]
  )

  return (
    <PopupContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[200] flex w-[min(92vw,360px)] flex-col gap-2">
        {items.map((n) => (
          <div key={n.id} className={`pointer-events-auto rounded-xl border px-4 py-3 shadow-md ${toneClass(n.tone)}`}>
            <div className="flex items-start gap-2">
              <p className="text-sm font-medium leading-5">{n.text}</p>
              <button
                type="button"
                onClick={() => remove(n.id)}
                className="ml-auto rounded px-1 text-xs opacity-70 hover:opacity-100"
                aria-label="Close notification"
              >
                x
              </button>
            </div>
          </div>
        ))}
      </div>
    </PopupContext.Provider>
  )
}

export function usePopup() {
  const ctx = useContext(PopupContext)
  if (!ctx) {
    throw new Error('usePopup must be used within PopupProvider')
  }
  return ctx
}
