/**
 * Kiosk flow: back row with chevron + label (e.g. “Your details”).
 */
export default function KioskBackButton({ onBack, children }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="inline-flex items-center gap-2 text-left text-sm text-gray-600 transition-colors hover:text-gray-900 sm:text-base"
    >
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      <span className="font-medium underline-offset-4 hover:underline">{children}</span>
    </button>
  )
}
