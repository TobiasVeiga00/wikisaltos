import { sameTitle } from '../../shared/titles'
import type { ArticleRef, ArticleSummary } from './Article'

export type RaceOutcome = 'won' | 'surrendered' | 'timeout'

export interface Race {
  readonly origin: ArticleRef
  readonly target: ArticleSummary
  /**
   * The walk used to build this pair, origin first and target last.
   * Because the target was reached by walking real links, this is a guaranteed
   * upper bound on the shortest path — the race can never be unsolvable.
   */
  readonly knownPath: readonly string[]
  /** Titles the player actually visited, origin first. */
  readonly path: readonly string[]
  readonly startedAt: number
  readonly limitMs: number
  readonly outcome: RaceOutcome | null
  readonly finishedAt: number | null
}

export function createRace(
  origin: ArticleRef,
  target: ArticleSummary,
  knownPath: readonly string[],
  limitMs: number,
  now: number,
): Race {
  return {
    origin,
    target,
    knownPath,
    path: [origin.title],
    startedAt: now,
    limitMs,
    outcome: null,
    finishedAt: null,
  }
}

export function visit(race: Race, title: string, now: number): Race {
  if (race.outcome !== null) return race
  const path = [...race.path, title]
  if (sameTitle(title, race.target.title)) {
    return { ...race, path, outcome: 'won', finishedAt: now }
  }
  return { ...race, path }
}

export function finish(race: Race, outcome: Exclude<RaceOutcome, 'won'>, now: number): Race {
  if (race.outcome !== null) return race
  return { ...race, outcome, finishedAt: now }
}

/** A jump is a link click, so the origin itself does not count. */
export function jumps(race: Race): number {
  return Math.max(0, race.path.length - 1)
}

export function remainingMs(race: Race, now: number): number {
  return Math.max(0, race.limitMs - ((race.finishedAt ?? now) - race.startedAt))
}

/** How long a finished race took. An unfinished one has taken nothing yet. */
export function elapsedMs(race: Race): number {
  return Math.min(race.limitMs, (race.finishedAt ?? race.startedAt) - race.startedAt)
}

export function isOver(race: Race): boolean {
  return race.outcome !== null
}
