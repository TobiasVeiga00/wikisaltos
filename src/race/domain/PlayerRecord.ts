import { elapsedMs, jumps as countJumps, type Race, type RaceOutcome } from './Race'

/**
 * What a player keeps between sessions.
 *
 * Only the most recent daily result is kept: the point is to know whether today
 * has been played, and a full history would be a growing blob nobody reads.
 */
export interface DailyResult {
  readonly dayId: string
  readonly outcome: RaceOutcome
  readonly jumps: number
  readonly elapsedMs: number
  readonly bestJumps: number | null
  readonly origin: string
  readonly target: string
}

export interface PlayerRecord {
  readonly streak: number
  readonly bestStreak: number
  readonly played: number
  readonly won: number
  readonly daily: DailyResult | null
}

export const NEW_PLAYER: PlayerRecord = {
  streak: 0,
  bestStreak: 0,
  played: 0,
  won: 0,
  daily: null,
}

/**
 * Folds a finished race into the record. The daily result is written once and
 * never overwritten: the day is a single attempt, and letting a second run
 * replace it would make the first one meaningless.
 */
export function recordRace(
  record: PlayerRecord,
  race: Race,
  bestJumps: number | null,
): PlayerRecord {
  if (race.outcome === null) return record

  const won = race.outcome === 'won'
  const streak = won ? record.streak + 1 : 0

  const daily =
    race.dayId !== null && record.daily?.dayId !== race.dayId
      ? {
          dayId: race.dayId,
          outcome: race.outcome,
          jumps: countJumps(race),
          elapsedMs: elapsedMs(race),
          bestJumps,
          origin: race.origin.title,
          target: race.target.title,
        }
      : record.daily

  return {
    streak,
    bestStreak: Math.max(record.bestStreak, streak),
    played: record.played + 1,
    won: record.won + (won ? 1 : 0),
    daily,
  }
}

/**
 * The shortest path is only known a moment after the race ends, so it arrives
 * as a second, smaller write. It never overwrites a value already there.
 */
export function recordDailyBest(
  record: PlayerRecord,
  dayId: string,
  bestJumps: number,
): PlayerRecord {
  if (record.daily?.dayId !== dayId || record.daily.bestJumps !== null) return record
  return { ...record, daily: { ...record.daily, bestJumps } }
}

/**
 * How big a streak this race just ended, if it ended one. A single win is not a
 * streak, so the caller decides what is worth announcing.
 */
export function streakBrokenBy(record: PlayerRecord, outcome: RaceOutcome): number | null {
  return outcome !== 'won' && record.streak > 0 ? record.streak : null
}

export function dailyResultFor(record: PlayerRecord, dayId: string): DailyResult | null {
  return record.daily?.dayId === dayId ? record.daily : null
}

export function hasPlayedDaily(record: PlayerRecord, dayId: string): boolean {
  return dailyResultFor(record, dayId) !== null
}
