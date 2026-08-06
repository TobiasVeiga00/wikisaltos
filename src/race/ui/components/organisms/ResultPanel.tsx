import { formatElapsed } from '../../../../shared/time'
import { sameTitle } from '../../../../shared/titles'
import type { RaceOutcome } from '../../../domain/Race'
import type { Streak } from '../../../domain/Streak'
import { Button } from '../atoms/Button'
import { Spinner } from '../atoms/Spinner'
import { RouteList } from '../molecules/RouteList'

const HEADLINE: Record<RaceOutcome, string> = {
  won: 'Llegaste',
  surrendered: 'Abandonaste',
  timeout: 'Se acabó el tiempo',
}

const jumpsLabel = (count: number) => `${count} ${count === 1 ? 'salto' : 'saltos'}`

const samePath = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((title, index) => sameTitle(title, b[index] ?? ''))

/** The one sentence the panel exists to deliver: how this run compares to the best one. */
function verdict(outcome: RaceOutcome, playerJumps: number, bestJumps: number): string {
  if (outcome !== 'won') return `Se podía llegar en ${jumpsLabel(bestJumps)}.`
  if (playerJumps === bestJumps) return 'Nadie podía llegar en menos saltos.'
  const extra = playerJumps - bestJumps
  return `El camino más corto era de ${jumpsLabel(bestJumps)}: ${jumpsLabel(extra)} de más.`
}

interface ResultPanelProps {
  readonly outcome: RaceOutcome
  readonly playerPath: readonly string[]
  readonly bestPath: readonly string[] | null
  readonly resolvingBestPath: boolean
  readonly elapsedMs: number
  readonly streak: Streak
  readonly preparingNext: boolean
  readonly onPlayAgain: () => void
  readonly onGoHome: () => void
}

export function ResultPanel({
  outcome,
  playerPath,
  bestPath,
  resolvingBestPath,
  elapsedMs,
  streak,
  preparingNext,
  onPlayAgain,
  onGoHome,
}: ResultPanelProps) {
  const playerJumps = Math.max(0, playerPath.length - 1)
  const bestJumps = bestPath === null ? null : Math.max(0, bestPath.length - 1)

  // Several routes can be equally short. Showing a different one under the
  // heading "the shortest path" reads as a correction when there was nothing to
  // correct, so it gets named for what it actually is.
  const identical = bestPath !== null && samePath(playerPath, bestPath)
  const alternative = bestPath !== null && !identical && bestJumps === playerJumps
  const bestHeading = alternative ? 'Otro camino igual de corto' : 'El camino más corto'

  return (
    <section className="result">
      <header className="result__head">
        <h2 className="result__headline">{HEADLINE[outcome]}</h2>
        {bestJumps !== null && (
          <p className="result__verdict">{verdict(outcome, playerJumps, bestJumps)}</p>
        )}

        {/* Una sola victoria no es una racha, así que el cartel recién habla de dos. */}
        {streak.count > 1 && (
          <p className="result__streak">
            Racha de <strong>{streak.count}</strong> seguidas.
          </p>
        )}
        {streak.brokenAt !== null && streak.brokenAt > 1 && (
          <p className="result__streak result__streak--broken">
            Se cortó una racha de <strong>{streak.brokenAt}</strong>.
          </p>
        )}
      </header>

      <section className="result__route">
        <div className="result__route-head">
          <h3>Tu recorrido</h3>
          <span className="result__count">
            {jumpsLabel(playerJumps)} · {formatElapsed(elapsedMs)}
          </span>
        </div>
        <RouteList
          titles={playerPath}
          {...(playerJumps === 0 ? { note: 'No saliste del primer artículo.' } : {})}
        />
      </section>

      {!identical && (
        <section className="result__route">
          <div className="result__route-head">
            <h3>{bestHeading}</h3>
            {bestJumps !== null && <span className="result__count">{jumpsLabel(bestJumps)}</span>}
          </div>
          {bestPath === null ? (
            resolvingBestPath ? (
              <Spinner label="Buscándolo" />
            ) : (
              <p className="route__note">No se pudo calcular.</p>
            )
          ) : (
            <RouteList titles={bestPath} tone="best" />
          )}
        </section>
      )}

      <div className="result__actions">
        <Button onClick={onPlayAgain} disabled={preparingNext}>
          {preparingNext ? 'Armando la carrera…' : 'Otra carrera'}
        </Button>
        <Button variant="ghost" onClick={onGoHome} disabled={preparingNext}>
          Volver al inicio
        </Button>
      </div>
    </section>
  )
}
