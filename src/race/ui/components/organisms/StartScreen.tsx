import { formatClock } from '../../../../shared/time'
import { formatDayId } from '../../../domain/DailyChallenge'
import { Button } from '../atoms/Button'
import { Spinner } from '../atoms/Spinner'

interface StartScreenProps {
  readonly preparing: boolean
  readonly error: string | null
  readonly jumps: number
  readonly limitMs: number
  readonly streak: number
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
  streak,
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

      {streak > 0 && (
        <p className="start__streak">
          Venís con <strong>{streak}</strong> {streak === 1 ? 'ganada' : 'ganadas'} al hilo.
        </p>
      )}

      {error !== null && <p className="start__error">{error}</p>}

      {preparing ? (
        <Spinner label="Armando la carrera" />
      ) : (
        <div className="start__actions">
          <Button onClick={onStartDaily}>
            {dayId === null ? 'Desafío del día' : `Desafío del ${formatDayId(dayId)}`}
          </Button>
          <Button variant="ghost" onClick={onStartRandom}>
            Carrera al azar
          </Button>
        </div>
      )}

      {!preparing && (
        <p className="start__note">
          El desafío del día es el mismo para todo el mundo. Jugalo y comparás con quien quieras.
        </p>
      )}
    </main>
  )
}
