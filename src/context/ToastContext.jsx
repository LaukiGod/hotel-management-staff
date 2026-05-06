import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const ToastContext = createContext(null)
const ConfirmContext = createContext(null)

const TYPE_STYLES = {
  success: {
    card: 'border-emerald-200 bg-emerald-50',
    iconWrap: 'bg-emerald-100 text-emerald-600',
    bar: 'bg-emerald-500',
    text: 'text-emerald-900',
    sub: 'text-emerald-800',
  },
  error: {
    card: 'border-red-200 bg-red-50',
    iconWrap: 'bg-red-100 text-red-600',
    bar: 'bg-red-500',
    text: 'text-red-900',
    sub: 'text-red-800',
  },
  warning: {
    card: 'border-amber-200 bg-amber-50',
    iconWrap: 'bg-amber-100 text-amber-700',
    bar: 'bg-amber-500',
    text: 'text-amber-900',
    sub: 'text-amber-800',
  },
  info: {
    card: 'border-gray-200 bg-white',
    iconWrap: 'bg-gray-100 text-gray-700',
    bar: 'bg-gray-700',
    text: 'text-gray-900',
    sub: 'text-gray-700',
  },
}

function ToastIcon({ type }) {
  if (type === 'success') {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    )
  }
  if (type === 'error') {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    )
  }
  if (type === 'warning') {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 4h.01M10.29 3.86l-8.18 14.18A2 2 0 003.84 21h16.32a2 2 0 001.73-2.96L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    )
  }
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 22a10 10 0 110-20 10 10 0 010 20z" />
    </svg>
  )
}

function ToastItem({ toast, onDismiss }) {
  const styles = TYPE_STYLES[toast.type] || TYPE_STYLES.info
  const hasTitle = Boolean(toast.title)
  const hasMessage = Boolean(toast.message)
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 32, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 32, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className={`pointer-events-auto relative w-full overflow-hidden rounded-2xl border shadow-lg shadow-black/5 ${styles.card}`}
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
    >
      <div className={`absolute left-0 top-0 h-full w-1 ${styles.bar}`} aria-hidden />
      <div className="flex items-center gap-3 px-4 py-3 pl-5">
        <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${styles.iconWrap}`}>
          <ToastIcon type={toast.type} />
        </div>
        <div className="min-w-0 flex-1">
          {hasTitle ? (
            <p className={`text-sm font-semibold ${styles.text}`}>{toast.title}</p>
          ) : null}
          {hasMessage ? (
            <p
              className={`text-sm break-words whitespace-pre-wrap ${
                hasTitle ? styles.sub : `font-medium ${styles.text}`
              }`}
            >
              {toast.message}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="shrink-0 -mr-1 rounded-lg p-1 text-gray-400 hover:bg-black/5 hover:text-gray-600 transition-colors"
          aria-label="Dismiss notification"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </motion.div>
  )
}

function Toaster({ toasts, onDismiss }) {
  if (typeof document === 'undefined') return null
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4 sm:inset-x-auto sm:right-6 sm:top-6 sm:justify-end sm:px-0">
      <div className="flex w-full max-w-sm flex-col gap-2">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

const CONFIRM_TONES = {
  danger: {
    icon: 'bg-red-100 text-red-600',
    button: 'bg-red-600 hover:bg-red-700 text-white',
    ring: 'focus-visible:ring-red-500',
  },
  warning: {
    icon: 'bg-amber-100 text-amber-700',
    button: 'bg-amber-600 hover:bg-amber-700 text-white',
    ring: 'focus-visible:ring-amber-500',
  },
  default: {
    icon: 'bg-gray-100 text-gray-700',
    button: 'bg-gray-900 hover:bg-gray-800 text-white',
    ring: 'focus-visible:ring-gray-500',
  },
}

function ConfirmIcon({ tone }) {
  if (tone === 'danger') {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    )
  }
  if (tone === 'warning') {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 4h.01M10.29 3.86l-8.18 14.18A2 2 0 003.84 21h16.32a2 2 0 001.73-2.96L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    )
  }
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 22a10 10 0 110-20 10 10 0 010 20z" />
    </svg>
  )
}

function ConfirmDialog({ state, onResolve }) {
  const confirmBtnRef = useRef(null)

  useEffect(() => {
    if (!state) return undefined
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const t = setTimeout(() => confirmBtnRef.current?.focus(), 30)
    function onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onResolve(false)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        onResolve(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      clearTimeout(t)
      document.body.style.overflow = prevOverflow
    }
  }, [state, onResolve])

  return (
    <AnimatePresence>
      {state ? (
        <motion.div
          key="confirm-overlay"
          className="fixed inset-0 z-[110] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby={state.message ? 'confirm-desc' : undefined}
        >
          <button
            type="button"
            aria-label="Cancel"
            onClick={() => onResolve(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px] cursor-default"
          />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden"
          >
            <div className="px-5 pt-5 pb-2 flex items-start gap-3">
              <div className={`shrink-0 mt-0.5 h-10 w-10 rounded-full flex items-center justify-center ${CONFIRM_TONES[state.tone].icon}`}>
                <ConfirmIcon tone={state.tone} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="confirm-title" className="text-base font-semibold text-gray-900">
                  {state.title}
                </h2>
                {state.message ? (
                  <p id="confirm-desc" className="mt-1 text-sm text-gray-600 break-words whitespace-pre-wrap">
                    {state.message}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="px-5 pt-3 pb-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => onResolve(false)}
                className="px-3.5 py-2 rounded-xl text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 transition-colors"
              >
                {state.cancelLabel}
              </button>
              <button
                ref={confirmBtnRef}
                type="button"
                onClick={() => onResolve(true)}
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 ${CONFIRM_TONES[state.tone].button} ${CONFIRM_TONES[state.tone].ring}`}
              >
                {state.confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export function ToastProvider({ children, max = 4 }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)
  const timersRef = useRef(new Map())
  const [confirmState, setConfirmState] = useState(null)
  const resolverRef = useRef(null)

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const tm = timersRef.current.get(id)
    if (tm) {
      clearTimeout(tm)
      timersRef.current.delete(id)
    }
  }, [])

  const notify = useCallback(
    (input) => {
      const opts = typeof input === 'string' ? { message: input } : input || {}
      const id = ++idRef.current
      const toast = {
        id,
        type: opts.type || 'info',
        title: opts.title,
        message: opts.message ? String(opts.message) : '',
        duration: opts.duration == null ? 4200 : Number(opts.duration),
      }
      setToasts((prev) => {
        const next = [...prev, toast]
        return next.length > max ? next.slice(next.length - max) : next
      })
      if (toast.duration > 0) {
        const tm = setTimeout(() => dismiss(id), toast.duration)
        timersRef.current.set(id, tm)
      }
      return id
    },
    [dismiss, max]
  )

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach((tm) => clearTimeout(tm))
      timers.clear()
    }
  }, [])

  const api = useMemo(
    () => ({
      notify,
      dismiss,
      success: (message, opts = {}) => notify({ ...opts, type: 'success', message }),
      error: (message, opts = {}) => notify({ ...opts, type: 'error', message }),
      warning: (message, opts = {}) => notify({ ...opts, type: 'warning', message }),
      info: (message, opts = {}) => notify({ ...opts, type: 'info', message }),
    }),
    [notify, dismiss]
  )

  const resolveConfirm = useCallback((value) => {
    const r = resolverRef.current
    resolverRef.current = null
    setConfirmState(null)
    if (r) r(value)
  }, [])

  const confirm = useCallback((input) => {
    const opts = typeof input === 'string' ? { title: input } : input || {}
    return new Promise((resolve) => {
      if (resolverRef.current) {
        resolverRef.current(false)
      }
      resolverRef.current = resolve
      setConfirmState({
        title: opts.title || 'Are you sure?',
        message: opts.message || '',
        confirmLabel: opts.confirmLabel || 'Confirm',
        cancelLabel: opts.cancelLabel || 'Cancel',
        tone: CONFIRM_TONES[opts.tone] ? opts.tone : 'default',
      })
    })
  }, [])

  return (
    <ToastContext.Provider value={api}>
      <ConfirmContext.Provider value={confirm}>
        {children}
        <Toaster toasts={toasts} onDismiss={dismiss} />
        <ConfirmDialog state={confirmState} onResolve={resolveConfirm} />
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return ctx
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) {
    throw new Error('useConfirm must be used within a ToastProvider')
  }
  return ctx
}
