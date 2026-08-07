import { useEffect, useRef } from 'react'
import type { ArticleSummary } from '../../../domain/Article'
import { formatClock } from '../../../../shared/time'
import { Button } from '../atoms/Button'
import { PathTrail } from '../molecules/PathTrail'
import { Readout } from '../molecules/Readout'
import { ObjectiveBlock } from './ObjectiveBlock'

const WARNING_THRESHOLD_MS = 30_000

interface RaceHudProps {
  readonly target: ArticleSummary
  readonly path: readonly string[]
  readonly jumps: number
  readonly remainingMs: number
  readonly streak: number
  readonly dayId: string | null
  readonly onGiveUp: () => void
}

export function RaceHud({
  target,
  path,
  jumps,
  remainingMs,
  streak,
  dayId,
  onGiveUp,
}: RaceHudProps) {
  const trailRef = useRef<HTMLElement>(null)

  // The trail scrolls sideways once it outgrows the screen, and new steps are
  // appended on the right. Left alone it keeps showing the opening articles
  // while the one you are actually standing on drifts out of view.
  useEffect(() => {
    const trail = trailRef.current
    if (trail) trail.scrollLeft = trail.scrollWidth
  }, [path.length])

  return (
    <>
      <div className="hud">
        <ObjectiveBlock target={target} />

        <div className="readout">
          <Readout
            label="Tiempo"
            value={formatClock(remainingMs)}
            warning={remainingMs <= WARNING_THRESHOLD_MS}
          />
          <Readout label="Saltos" value={String(jumps)} />
          {streak > 0 && <Readout label="Racha" value={String(streak)} />}
          <Button variant="danger" onClick={onGiveUp}>
            Abandonar
          </Button>
        </div>
      </div>

      <nav className="trailbar" aria-label="Recorrido" ref={trailRef}>
        <span className="label">{dayId === null ? 'Recorrido' : 'Desafío del día'}</span>
        <PathTrail titles={path} />
      </nav>
    </>
  )
}
