import { useEffect, useState } from 'react'

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
  closeOnBackdrop = true,
}) {
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) setBusy(false)
  }, [open])

  async function handleConfirm() {
    if (busy) return
    if (!onConfirm) return
    try {
      setBusy(true)
      await onConfirm()
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" role="presentation">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => {
          if (!closeOnBackdrop || busy) return
          onCancel?.()
        }}
      />

      <div
        className="relative w-full max-w-md rounded-3xl border border-gray-200 bg-white shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Confirm'}
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{danger ? 'Warning' : 'Confirm'}</p>
            <h3 className="text-base font-bold text-gray-900 leading-tight">{title || 'Please confirm'}</h3>
          </div>

          <button
            type="button"
            onClick={() => {
              if (busy) return
              onCancel?.()
            }}
            disabled={busy}
            className="h-9 w-9 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-60"
            aria-label="Close dialog"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-6">
          {description ? <p className="text-sm text-gray-600 leading-relaxed">{description}</p> : null}

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                if (busy) return
                onCancel?.()
              }}
              disabled={busy}
              className="h-11 rounded-2xl border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 transition disabled:opacity-50"
            >
              {cancelText}
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={busy}
              className={[
                'h-11 rounded-2xl px-4 font-semibold transition disabled:opacity-50',
                danger ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-900 text-white hover:bg-gray-800',
              ].join(' ')}
            >
              {busy ? 'Working…' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

