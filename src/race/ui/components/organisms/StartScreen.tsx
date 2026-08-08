import { formatElapsed } from '../../../../shared/time'
import { formatDayId } from '../../../domain/DailyChallenge'
import type { DailyResult, PlayerRecord } from '../../../domain/PlayerRecord'
import type { RaceProgress } from '../../../domain/ports/RaceGenerator'
import { jumpsLabel, OUTCOME_HEADLINE, verdict } from '../../copy'
import { Button } from '../atoms/Button'
import { BuildProgress } from '../molecules/BuildProgress'
import { PlayerStats } from '../molecules/PlayerStats'

interface StartScreenProps {
  readonly preparing: boolean
  readonly progress: RaceProgress | null
  readonly error: string | null
  readonly jumps: number
  readonly limitMs: number
  readonly record: PlayerRecord
  /** Today's result if it was already played. One attempt per day, and this is the proof. */
  readonly dailyResult: DailyResult | null
  /** Null until the clock has been read after mounting. */
  readonly dayId: string | null
  readonly onStartDaily: () => void
  readonly onStartRandom: () => void
}

export function StartScreen({
  preparing,
  progress,
  error,
  jumps,
  limitMs,
  record,
  dailyResult,
  dayId,
  onStartDaily,
  onStartRandom,
}: StartScreenProps) {
  const minutes = Math.round(limitMs / 60_000)

  return (
    <main className="start">
      <h1 className="wordmark">
        Wiki<strong>saltos</strong>
      </h1>

      <p className="start__lede">
        Te toca un artículo de Wikipedia y un destino al que llegar. Se avanza haciendo clic en los
        enlaces del texto: no hay buscador.
      </p>

      <ul className="start__rules">
        <li>Tenés {minutes} minutos.</li>
        {/* "o menos" no es un matiz: la caminata puede quedar corta si se topa
            con un artículo sin salidas, y prometer un número exacto sería falso. */}
        <li>Siempre hay solución: el destino está a {jumps} saltos o menos.</li>
        <li>Al terminar ves tu camino y cuál era el más corto.</li>
      </ul>

      <PlayerStats record={record} />

      {dailyResult !== null && <DailyCard result={dailyResult} />}

      {error !== null && <p className="start__error">{error}</p>}

      {preparing ? (
        <BuildProgress progress={progress} />
      ) : (
        <div className="start__actions">
          {dailyResult === null && (
            <Button onClick={onStartDaily}>
              {dayId === null ? 'Desafío del día' : `Desafío del ${formatDayId(dayId)}`}
            </Button>
          )}
          <Button variant={dailyResult === null ? 'ghost' : 'primary'} onClick={onStartRandom}>
            Carrera al azar
          </Button>
        </div>
      )}

      {!preparing && dailyResult === null && (
        <p className="start__note">
          El desafío del día es el mismo para todo el mundo, y se juega una sola vez.
        </p>
      )}
    </main>
  )
}

/**
 * Today's result, in the same order the result panel uses: what happened, how it
 * compares, then the details. Repeating that shape is the point — the player has
 * already read it once today.
 */
function DailyCard({ result }: { readonly result: DailyResult }) {
  return (
    <section className="daily-card">
      <p className="daily-card__day">Desafío del {formatDayId(result.dayId)}</p>
      <p className="daily-card__headline">{OUTCOME_HEADLINE[result.outcome]}</p>

      {result.bestJumps !== null && (
        <p className="daily-card__verdict">
          {verdict(result.outcome, result.jumps, result.bestJumps)}
        </p>
      )}

      <p className="daily-card__route">
        {result.origin} <span aria-hidden="true">→</span> {result.target}
      </p>
      <p className="daily-card__detail">
        {jumpsLabel(result.jumps)} · {formatElapsed(result.elapsedMs)}
      </p>

      <p className="daily-card__detail daily-card__detail--muted">Mañana hay uno nuevo.</p>
    </section>
  )
}
