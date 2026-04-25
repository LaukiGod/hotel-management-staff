/**
 * Sticky top bar for admin / staff pages: title, optional primary action, optional badge.
 */
export default function AdminPanelHeader({
  title,
  subtitle,
  badge,
  actionLabel,
  onAction,
  actionDisabled,
  children,
}) {
  return (
    <div className="sticky top-0 z-20 w-full min-w-0 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="flex min-h-14 w-full min-w-0 flex-col gap-3 px-4 py-3 sm:min-h-[3.5rem] sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-3.5">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-2.5">
            <h1 className="truncate text-lg font-bold text-gray-900 sm:text-xl md:text-2xl">{title}</h1>
            {badge ? (
              <span className="shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-800">
                {badge}
              </span>
            ) : null}
          </div>
          {subtitle ? <p className="mt-0.5 text-sm text-gray-500 sm:mt-1">{subtitle}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {onAction && actionLabel ? (
            <button
              type="button"
              onClick={onAction}
              disabled={actionDisabled}
              className="inline-flex w-full min-w-0 items-center justify-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 active:bg-gray-900 disabled:opacity-50 sm:w-auto"
            >
              <span className="text-base leading-none" aria-hidden>
                +
              </span>
              {actionLabel}
            </button>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  )
}
