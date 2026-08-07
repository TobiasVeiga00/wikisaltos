import type { PlayerRecord } from '../../../domain/PlayerRecord'

interface PlayerStatsProps {
  readonly record: PlayerRecord
}

/**
 * Nothing here is shown to a player who has not finished a race yet: four zeros
 * say less than the rules above them, and they push the buttons off the fold.
 */
export function PlayerStats({ record }: PlayerStatsProps) {
  if (record.played === 0) return null

  const rate = Math.round((record.won / record.played) * 100)

  return (
    <dl className="stats">
      <Stat label="Jugadas" value={record.played} />
      <Stat label="Ganadas" value={`${String(rate)}%`} />
      <Stat label="Racha" value={record.streak} />
      <Stat label="Mejor racha" value={record.bestStreak} />
    </dl>
  )
}

function Stat({ label, value }: { readonly label: string; readonly value: string | number }) {
  return (
    <div className="stats__item">
      <dt className="stats__label">{label}</dt>
      <dd className="stats__value">{value}</dd>
    </div>
  )
}
