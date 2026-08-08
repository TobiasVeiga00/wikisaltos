import { formatElapsed } from '../../../../shared/time'
import { sameTitle } from '../../../../shared/titles'
import { formatDayId } from '../../../domain/DailyChallenge'
import { jumps as countJumps, type Race } from '../../../domain/Race'
import type { RaceProgress } from '../../../domain/ports/RaceGenerator'
import { Button } from '../atoms/Button'
import { BuildProgress } from '../molecules/BuildProgress'
import { Spinner } from '../atoms/Spinner'
import { RouteList } from '../molecules/RouteList'
import { jumpsLabel, OUTCOME_HEADLINE, verdict } from '../../copy'

const samePath = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((title, index) => sameTitle(title, b[index] ?? ''))

interface ResultPanelProps {
  readonly race: Race
  readonly bestPath: readonly string[] | null
  readonly resolvingBestPath: boolean
  readonly elapsedMs: number
  readonly streak: number
  readonly bestStreak: number
  /** How long the streak this race just ended was, if it ended one. */
  readonly brokenStreak: number | null
  readonly preparingNext: boolean
  readonly progress: RaceProgress | null
  /** Chains the next race off this destination. Only offered after a win. */
  readonly onContinue: () => void
  readonly onPlayAgain: () => void
  readonly onGoHome: () => void
}

export function ResultPanel({
  race,
  bestPath,
  resolvingBestPath,
  elapsedMs,
  streak,
  bestStreak,
  brokenStreak,
  preparingNext,
  progress,
  onContinue,
  onPlayAgain,
  onGoHome,
}: ResultPanelProps) {
  const outcome = race.outcome
  if (outcome === null) return null

  const playerPath = race.path
  const playerJumps = countJumps(race)
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
        {race.dayId !== null && (
          <p className="result__day">Desafío del {formatDayId(race.dayId)}</p>
        )}
        <h2 className="result__headline">{OUTCOME_HEADLINE[outcome]}</h2>
        {bestJumps !== null && (
          <p className="result__verdict">{verdict(outcome, playerJumps, bestJumps)}</p>
        )}

        {/* Una sola victoria no es una racha, así que el cartel recién habla de dos. */}
        {streak > 1 && (
          <p className="result__streak">
            Racha de <strong>{streak}</strong> seguidas
            {streak === bestStreak && ', tu mejor marca'}.
          </p>
        )}
        {brokenStreak !== null && brokenStreak > 1 && (
          <p className="result__streak result__streak--broken">
            Se cortó una racha de <strong>{brokenStreak}</strong>. La mejor sigue siendo{' '}
            <strong>{bestStreak}</strong>.
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

      {preparingNext ? (
        <BuildProgress progress={progress} />
      ) : (
        <div className="result__actions">
          {/* Ganar deja el destino como punto de partida: la carrera siguiente
              arranca donde terminó esta. Perder corta la cadena junto con la
              racha, así que ahí el botón dice otra cosa y hace otra cosa. */}
          {outcome === 'won' ? (
            <Button onClick={onContinue}>Seguir desde acá</Button>
          ) : (
            <Button onClick={onPlayAgain}>Carrera nueva</Button>
          )}
          <Button variant="ghost" onClick={onGoHome}>
            Volver al inicio
          </Button>
        </div>
      )}
    </section>
  )
}
