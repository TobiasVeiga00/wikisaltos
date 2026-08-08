import type { RaceProgress } from '../../../domain/ports/RaceGenerator'

interface BuildProgressProps {
  /** Null before the first round trip reports back. */
  readonly progress: RaceProgress | null
}

/**
 * What a spinner cannot say: whether anything is happening.
 *
 * Every number here is work Wikipedia actually finished answering — no timer,
 * no easing. A round trip nobody planned for still moves it, so a run of
 * rejected branches reads as slow rather than as frozen, which is the whole
 * point.
 */
export function BuildProgress({ progress }: BuildProgressProps) {
  const percent = progress === null ? 0 : Math.round((progress.done / progress.total) * 100)
  const label = progress?.label ?? 'Armando la carrera'

  return (
    <div
      className="build"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className="build__head">
        <span className="build__label">{label}</span>
        <span className="build__percent">{percent}%</span>
      </div>
      <div className="build__track">
        <div className="build__fill" style={{ width: `${String(percent)}%` }} />
      </div>
    </div>
  )
}
