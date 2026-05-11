import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import KioskShell from '../../components/KioskShell'
import { useKioskSession } from '../../context/KioskSessionContext'
import { getCombinedResumePath, onKioskFlowExplicitStart } from '../../utils/sessionCoordination'
import styles from './KioskWelcome.module.css'

const FOOD_IMAGES = [
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600&q=85',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1600&q=85',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1600&q=85',
]

const STATS = [
  { val: '09', label: 'Active Tables', color: 'var(--ember)' },
  { val: 'AI', label: 'Allergy Engine', color: 'var(--cyan)' },
  { val: '3', label: 'Order States', color: 'var(--text-secondary)' },
  { val: 'RT', label: 'Real-time', color: 'var(--ember)' },
]
const RESUME_DELAY_MS = 1500

function Logo({ size = 38 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <circle cx="20" cy="20" r="18" stroke="var(--ember)" strokeWidth="1.2" opacity="0.35" />
      <path
        d="M20 8 C20 8 29 13.5 29 20 C29 27 20 32 20 32 C20 32 11 27 11 20 C11 13.5 20 8 20 8Z"
        fill="var(--ember)"
        opacity="0.92"
      />
      <circle cx="20" cy="20" r="5.5" fill="rgba(7,8,9,0.95)" />
      <circle cx="20" cy="20" r="2.5" fill="var(--ember)" />
      <line x1="20" y1="1.5" x2="20" y2="8.5" stroke="var(--cyan)" strokeWidth="1.8" strokeLinecap="round" opacity="0.85" />
      <circle cx="20" cy="1.5" r="1.8" fill="var(--cyan)" opacity="0.85" />
    </svg>
  )
}

export default function KioskWelcome() {
  const navigate = useNavigate()
  const location = useLocation()
  const { tableNo, user, orderId, kioskPath } = useKioskSession()
  const [imgIndex, setImgIndex] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const idleTimer = useRef(null)
  /** When true, skip resuming to a deeper step (user explicitly chose to view welcome). */
  const stayOnWelcomeRef = useRef(false)
  /**
   * Computed once on mount: the path to resume to (customer session or kiosk session).
   * Stored in a ref so the idle timer and proceed() can check it without stale closures.
   */
  const resumePathRef = useRef(null)

  const restaurantName = import.meta.env.VITE_RESTAURANT_NAME || 'Smart Restaurant'
  const restaurantTagline = import.meta.env.VITE_RESTAURANT_TAGLINE || 'AI-powered ordering with real-time allergy detection. Frictionless from your table to the kitchen.'

  useEffect(() => {
    const t1 = setTimeout(() => setLoaded(true), 60)
    const t2 = setInterval(() => setImgIndex((i) => (i + 1) % FOOD_IMAGES.length), 5500)
    return () => {
      clearTimeout(t1)
      clearInterval(t2)
    }
  }, [])

  useEffect(() => {
    if (location.state?.kioskIntent === 'showWelcome') {
      stayOnWelcomeRef.current = true
      resumePathRef.current = null
      navigate('/', { replace: true, state: null })
      return
    }
    if (stayOnWelcomeRef.current) {
      return
    }
    const p = getCombinedResumePath({ tableNo, user, orderId, kioskPath })
    resumePathRef.current = p
    if (p) {
      const t = setTimeout(() => {
        navigate(p, { replace: true })
      }, RESUME_DELAY_MS)
      return () => clearTimeout(t)
    }
  }, [navigate, tableNo, user, orderId, kioskPath, location.state])

  useEffect(() => {
    function goTables() {
      // Only clear the customer session and start a new kiosk flow if there is
      // no active session waiting to be resumed. If a resume path exists, the
      // auto-redirect above will handle navigation — don't interfere.
      if (resumePathRef.current) return
      onKioskFlowExplicitStart()
      navigate('/tables')
    }
    function resetIdle() {
      if (idleTimer.current) clearTimeout(idleTimer.current)
      idleTimer.current = setTimeout(goTables, 30_000)
    }
    resetIdle()
    window.addEventListener('pointerdown', resetIdle)
    window.addEventListener('pointermove', resetIdle)
    window.addEventListener('keydown', resetIdle)
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current)
      window.removeEventListener('pointerdown', resetIdle)
      window.removeEventListener('pointermove', resetIdle)
      window.removeEventListener('keydown', resetIdle)
    }
  }, [navigate])

  function proceed() {
    // If there is an active session to resume, a tap should not start a brand-new
    // kiosk flow (which would clear the customer session). Let the auto-redirect fire.
    if (resumePathRef.current) return
    stayOnWelcomeRef.current = false
    onKioskFlowExplicitStart()
    navigate('/tables')
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      proceed()
    }
  }

  return (
    <KioskShell className="!bg-transparent relative overflow-hidden">
      <div
        className={styles.root}
        onClick={proceed}
        onKeyDown={onKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Go to table selection. Tap or press Enter."
      >
        <div className={styles.bgWrap} aria-hidden>
          {FOOD_IMAGES.map((src, i) => (
            <div
              key={src}
              className={`${styles.bgSlide} ${i === imgIndex ? styles.bgSlideActive : ''}`}
              style={{ backgroundImage: `url(${src})` }}
            />
          ))}
          <div className={styles.bgLeft} />
          <div className={styles.bgFade} />
          <div className={styles.bgBottom} />
          <div className={styles.bgVignette} />
        </div>

        <div className={`${styles.page} ${loaded ? styles.pageVisible : ''}`}>
          <nav className={styles.nav}>
            <div className={styles.brand}>
              <Logo size={36} />
              <div className={styles.brandText}>
                <span className={`${styles.brandName} ${styles.typeDisplay}`}>{restaurantName}</span>
                <span className={`${styles.brandSub} ${styles.typeMono}`}>Restaurant intelligence</span>
              </div>
            </div>
            <div className={`${styles.onlineBadge} ${styles.typeMono}`}>
              <span className={styles.onlineDot} />
              SYSTEM ONLINE
            </div>
          </nav>

          <main className={styles.hero}>
            <div className={styles.accentLine} />
            <div className={styles.heroInner}>
              <div className={`${styles.pill} ${styles.typeMono}`}>
                <span className={styles.pillDot} />
                Food intelligence platform
              </div>
              <h1 className={`${styles.headline} ${styles.typeDisplay}`}>
                Where great food
                <br />
                meets <span className={styles.headlineAccent}>smart systems</span>
              </h1>
              <p className={`${styles.sub} ${styles.typeDisplay}`}>{restaurantTagline.replace(/\n/g, ' ')}</p>
              <p className={`${styles.tapHint} ${styles.typeDisplay} kiosk-pulse`}>
                Tap anywhere to begin
              </p>
            </div>
          </main>

          <footer className={styles.footer}>
            <div className={styles.footerLine} />
            <div className={styles.statsRow}>
              {STATS.map(({ val, label, color }) => (
                <div key={label} className={styles.stat}>
                  <span className={`${styles.statVal} ${styles.typeMono}`} style={{ color }}>
                    {val}
                  </span>
                  <span className={styles.statLabel}>{label}</span>
                </div>
              ))}
            </div>
          </footer>
        </div>
      </div>
    </KioskShell>
  )
}