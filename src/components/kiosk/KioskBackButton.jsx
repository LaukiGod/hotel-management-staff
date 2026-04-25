import { useNavigate } from 'react-router-dom'

export function KioskBackButton({ to, replace = true, onBack, children, className = '' }) {
  const navigate = useNavigate()

  function handleClick() {
    if (onBack) {
      onBack()
      return
    }
    if (to != null) {
      navigate(to, { replace })
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={[
        'inline-flex items-center gap-2 text-left text-sm sm:text-base',
        'text-white/80 hover:text-white active:text-white/90',
        'transition-colors min-h-11 -ml-1.5 pl-1.5 pr-3 py-1.5 rounded-xl hover:bg-white/5',
        className,
      ].join(' ')}
    >
      <span className="text-lg leading-none font-medium" aria-hidden>
        ←
      </span>
      <span className="font-medium">{children || 'Back'}</span>
    </button>
  )
}
