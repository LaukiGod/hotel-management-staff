import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { kioskAxios } from '../../api/kioskAxios'
import KioskShell from '../../components/KioskShell'

export default function KioskWelcome() {
  const navigate = useNavigate()
  const [dishes, setDishes] = useState([])
  const [error, setError] = useState('')

  const autoplay = useMemo(() => Autoplay({ delay: 2500, stopOnInteraction: false }), [])
  const [emblaRef] = useEmblaCarousel({ loop: true, align: 'start' }, [autoplay])

  const idleTimer = useRef(null)

  useEffect(() => {
    let mounted = true
    kioskAxios
      .get('/user/menu')
      .then((d) => {
        if (!mounted) return
        setDishes(Array.isArray(d.data) ? d.data : d.data?.dishes || [])
      })
      .catch((e) => setError(e?.response?.data?.message || e.message || 'Failed to load'))
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    function resetIdle() {
      if (idleTimer.current) clearTimeout(idleTimer.current)
      idleTimer.current = setTimeout(() => navigate('/tables'), 30_000)
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

  const accent = import.meta.env.VITE_KIOSK_ACCENT || '#F97316'
  const restaurantName = import.meta.env.VITE_RESTAURANT_NAME || 'Smart Restaurant'
  const restaurantTagline = import.meta.env.VITE_RESTAURANT_TAGLINE || 'Tap. Order. Pay. Relax.'
  const logoUrl = import.meta.env.VITE_RESTAURANT_LOGO || ''

  function proceed() {
    navigate('/tables')
  }

  return (
    <KioskShell className="relative overflow-hidden" >
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(1200px 600px at 20% 10%, rgba(255,255,255,0.08), transparent 60%), radial-gradient(900px 500px at 80% 30%, rgba(255,255,255,0.06), transparent 60%), linear-gradient(180deg, rgba(0,0,0,0.85), rgba(0,0,0,0.95))',
        }}
      />
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-30" style={{ backgroundColor: accent }} />
      <div className="absolute top-12 right-[-120px] h-96 w-96 rounded-full blur-3xl opacity-20" style={{ backgroundColor: accent }} />

      <button
        onClick={proceed}
        className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center px-6 pt-10 pb-32 text-center select-none"
        style={{ ['--accent']: accent }}
      >
        <div className="kiosk-ambient-steam absolute inset-0 pointer-events-none" />

        <div className="max-w-3xl mx-auto">
          <div className="mx-auto w-28 h-28 rounded-3xl bg-white/5 border border-white/10 backdrop-blur flex items-center justify-center shadow-[0_0_80px_rgba(249,115,22,0.25)]">
            {logoUrl ? (
              <img src={logoUrl} alt={restaurantName} className="w-20 h-20 object-contain" />
            ) : (
              <div className="w-16 h-16 rounded-2xl" style={{ backgroundColor: accent, boxShadow: `0 0 40px ${accent}55` }} />
            )}
          </div>

          <h1 className="mt-7 text-4xl md:text-6xl font-extrabold tracking-tight">
            <span className="text-white">{restaurantName}</span>
          </h1>
          <p className="mt-3 text-lg md:text-2xl text-white/75">
            {restaurantTagline}
          </p>

          {error ? <p className="mt-6 text-sm text-red-300">{error}</p> : null}
        </div>

        <div className="absolute bottom-24 left-0 right-0 px-6">
          <p className="kiosk-pulse text-sm md:text-base text-white/70">
            Tap anywhere to begin
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 pb-6">
          <div className="mx-auto max-w-5xl px-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-3">
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex gap-3">
                  {(dishes?.length ? dishes : Array.from({ length: 8 })).map((dish, idx) => {
                    const src = dish?.imageUrl
                    return (
                      <div key={dish?.dishId || dish?._id || idx} className="flex-[0_0_40%] sm:flex-[0_0_26%] md:flex-[0_0_18%]">
                        <div className="aspect-[4/3] rounded-xl overflow-hidden bg-white/5 border border-white/10">
                          {src ? (
                            <img src={src} alt={dish?.name || 'Dish'} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full bg-gradient-to-br from-white/10 to-white/0" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </button>
    </KioskShell>
  )
}

