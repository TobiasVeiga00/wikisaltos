import { formatClock, formatElapsed } from '../../../../shared/time'
import { formatDayId } from '../../../domain/DailyChallenge'
import type { DailyResult, PlayerRecord } from '../../../domain/PlayerRecord'
import type { RaceOutcome } from '../../../domain/Race'
import { Button } from '../atoms/Button'
import { Spinner } from '../atoms/Spinner'
import { PlayerStats } from '../molecules/PlayerStats'

const DAILY_HEADLINE: Record<RaceOutcome, string> = {
  won: 'Lo lograste',
  surrendered: 'Lo abandonaste',
  timeout: 'Se te acabó el tiempo',
}

interface StartScreenProps {
  readonly preparing: boolean
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
  error,
  jumps,
  limitMs,
  record,
  dailyResult,
  dayId,
  onStartDaily,
  onStartRandom,
}: StartScreenProps) {
  return (
    <main className="start">
      <h1 className="wordmark">
        Wiki<strong>saltos</strong>
      </h1>

      <p className="start__lede">
        Te toca un artículo de Wikipedia y un destino. Llegá de uno al otro usando solo los enlaces
        del texto.
      </p>

      <ul className="start__rules">
        <li>No hay buscador. Se avanza haciendo clic, nada más.</li>
        <li>Tenés {formatClock(limitMs)}.</li>
        {/* "o menos" no es un matiz: la caminata puede quedar corta si se topa
            con un artículo sin salidas, y prometer un número exacto sería falso. */}
        <li>El destino está a {jumps} saltos o menos, así que siempre hay salida.</li>
        <li>Al terminar ves tu recorrido y el camino más corto que existía.</li>
      </ul>

      <PlayerStats record={record} />

      {dailyResult !== null && <DailyCard result={dailyResult} />}

      {error !== null && <p className="start__error">{error}</p>}

      {preparing ? (
        <Spinner label="Armando la carrera" />
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

function DailyCard({ result }: { readonly result: DailyResult }) {
  const jumps = `${String(result.jumps)} ${result.jumps === 1 ? 'salto' : 'saltos'}`

  return (
    <section className="daily-card">
      <p className="daily-card__day">Desafío del {formatDayId(result.dayId)}</p>
      <p className="daily-card__headline">{DAILY_HEADLINE[result.outcome]}</p>
      <p className="daily-card__route">
        {result.origin} <span aria-hidden="true">→</span> {result.target}
      </p>
      {result.outcome === 'won' && (
        <p className="daily-card__detail">
          {jumps} en {formatElapsed(result.elapsedMs)}
          {result.bestJumps !== null &&
            (result.jumps === result.bestJumps
              ? ', el mínimo posible'
              : `, contra un mínimo de ${String(result.bestJumps)}`)}
          .
        </p>
      )}
      <p className="daily-card__detail daily-card__detail--muted">Mañana hay uno nuevo.</p>
    </section>
  )
}
