import { formatElapsed } from '../../shared/time'
import { formatDayId } from './DailyChallenge'
import { elapsedMs, jumps as countJumps, type Race } from './Race'

const SITE = 'https://tobiasveiga00.github.io/wikisaltos/'

/**
 * The line a player pastes into a chat. Without a backend this is the only way
 * two people compare the same daily challenge, so it carries everything needed
 * to understand the result without opening anything: which day, which pair, how
 * it went, and where to play.
 *
 * It deliberately does not reveal the route — that would spoil the challenge for
 * whoever reads it before playing.
 */
export function shareResult(race: Race, bestJumps: number | null): string {
  const heading = race.dayId === null ? 'Wikisaltos' : `Wikisaltos · ${formatDayId(race.dayId)}`
  const pair = `${race.origin.title} → ${race.target.title}`
  const minimum = bestJumps === null ? '' : ` (mínimo: ${bestJumps})`

  const outcome =
    race.outcome === 'won'
      ? `Llegué en ${countJumps(race)} ${countJumps(race) === 1 ? 'salto' : 'saltos'} y ${formatElapsed(elapsedMs(race))}${minimum}`
      : race.outcome === 'timeout'
        ? `Se me acabó el tiempo${minimum}`
        : `Abandoné${minimum}`

  return [heading, pair, outcome, SITE].join('\n')
}
