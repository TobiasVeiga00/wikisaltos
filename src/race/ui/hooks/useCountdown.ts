import { useEffect, useState } from 'react'

/**
 * Milliseconds left in the race. Ticking stops once the race freezes, and the
 * value is derived from timestamps rather than accumulated, so a throttled
 * background tab cannot drift the clock.
 *
 * `Math.max(now, startedAt)` matters on the first render of a new race: the
 * ticker still holds the previous race's reading, which is older than the new
 * start, and without the clamp the bar would briefly show more time than the
 * limit allows. The effect replaces it a moment later.
 */
export function useCountdown(
  startedAt: number | null,
  limitMs: number,
  frozenAt: number | null,
): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (startedAt === null || frozenAt !== null) return
    const id = window.setInterval(() => {
      setNow(Date.now())
    }, 200)
    return () => {
      window.clearInterval(id)
    }
  }, [startedAt, frozenAt])

  if (startedAt === null) return limitMs
  const reference = frozenAt ?? Math.max(now, startedAt)
  return Math.max(0, limitMs - (reference - startedAt))
}
