import { formatClock } from '../../../../shared/time'
import { Button } from '../atoms/Button'
import { Spinner } from '../atoms/Spinner'

interface StartScreenProps {
  readonly preparing: boolean
  readonly error: string | null
  readonly jumps: number
  readonly limitMs: number
  readonly streak: number
  readonly onStart: () => void
}

export function StartScreen({
  preparing,
  error,
  jumps,
  limitMs,
  streak,
  onStart,
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
        <Button onClick={onStart}>Empezar</Button>
      )}
    </main>
  )
}
