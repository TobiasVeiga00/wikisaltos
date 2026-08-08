import { formatElapsed } from '../../shared/time'
import type { DailyResult } from '../domain/PlayerRecord'
import type { RaceOutcome } from '../domain/Race'

/**
 * How the game talks about a finished race.
 *
 * It lives in one place because it is said in two: the panel that closes a race
 * and the card that remembers the day's. When those drifted apart the same win
 * was "Llegaste" in one and "Lo lograste" in the other, and the comparison
 * against the shortest path was worded twice — the second time badly.
 */
export const OUTCOME_HEADLINE: Record<RaceOutcome, string> = {
  won: 'Llegaste',
  surrendered: 'Abandonaste',
  timeout: 'Se acabó el tiempo',
}

export const jumpsLabel = (count: number): string =>
  `${String(count)} ${count === 1 ? 'salto' : 'saltos'}`

/** The one sentence that matters: how this run compares to the best one. */
export function verdict(outcome: RaceOutcome, playerJumps: number, bestJumps: number): string {
  if (outcome !== 'won') return `Se podía llegar en ${jumpsLabel(bestJumps)}.`
  if (playerJumps === bestJumps) return 'Nadie podía llegar en menos saltos.'
  return `El camino más corto era de ${jumpsLabel(bestJumps)}: ${jumpsLabel(playerJumps - bestJumps)} de más.`
}

/**
 * The same comparison squeezed into one line, for the card that only has to
 * remind you how today went. Losing a race says nothing worth counting, so it
 * reports the target instead of the attempt.
 */
export function dailySummary(result: DailyResult): string {
  if (result.outcome !== 'won') {
    return result.bestJumps === null ? '' : `Se podía llegar en ${jumpsLabel(result.bestJumps)}.`
  }
  const run = `${jumpsLabel(result.jumps)} en ${formatElapsed(result.elapsedMs)}`
  if (result.bestJumps === null) return `${run}.`
  return result.jumps === result.bestJumps
    ? `${run}, el mínimo posible.`
    : `${run}. El mínimo era ${jumpsLabel(result.bestJumps)}.`
}
