import { formatDayId } from '../../../domain/DailyChallenge'
import type { DailyResult, PlayerRecord } from '../../../domain/PlayerRecord'
import type { RaceProgress } from '../../../domain/ports/RaceGenerator'
import { dailySummary, OUTCOME_HEADLINE } from '../../copy'
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
        De un artículo de Wikipedia a otro, usando solo los enlaces del texto.
      </p>

      {/* Las reglas caben en un renglón. Eran una lista con líneas divisorias
          que ocupaba media pantalla para decir tres números — y el que ya jugó
          una vez no vuelve a leerlas. "o menos" no es un matiz: la caminata
          puede quedar corta, y prometer un número exacto sería falso. */}
      <p className="start__facts">
        {minutes} minutos · a {jumps} saltos o menos · sin buscador
      </p>

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
    </main>
  )
}

function DailyCard({ result }: { readonly result: DailyResult }) {
  const summary = dailySummary(result)

  return (
    <section className="daily-card">
      <p className="daily-card__day">Desafío del {formatDayId(result.dayId)} · volvé mañana</p>
      <p className="daily-card__headline">{OUTCOME_HEADLINE[result.outcome]}</p>
      <p className="daily-card__route">
        {result.origin} <span aria-hidden="true">→</span> {result.target}
      </p>
      {summary !== '' && <p className="daily-card__detail">{summary}</p>}
    </section>
  )
}
