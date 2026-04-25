import { useEffect, useState } from 'react'

/**
 * @param {string} query  e.g. "(min-width: 1024px)"
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined
    const m = window.matchMedia(query)
    const fn = () => setMatches(m.matches)
    fn()
    m.addEventListener('change', fn)
    return () => m.removeEventListener('change', fn)
  }, [query])

  return matches
}
