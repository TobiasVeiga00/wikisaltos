import type { RaceOutcome } from './Race'

export interface Streak {
  /** Races won in a row. */
  readonly count: number
  /**
   * The streak the last race ended, when it ended one. Kept so the result can
   * say what was lost — a streak that vanishes without a word is not a streak,
   * it is a counter.
   */
  readonly brokenAt: number | null
}

export const NO_STREAK: Streak = { count: 0, brokenAt: null }

export function afterRace(streak: Streak, outcome: RaceOutcome): Streak {
  if (outcome === 'won') return { count: streak.count + 1, brokenAt: null }
  return { count: 0, brokenAt: streak.count > 0 ? streak.count : null }
}
