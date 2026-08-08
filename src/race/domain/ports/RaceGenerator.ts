import type { ArticleRef, ArticleSummary } from '../Article'

export interface RacePair {
  readonly origin: ArticleRef
  readonly target: ArticleSummary
  /**
   * The walk that produced the target, origin first and target last. It may be
   * shorter than the jumps requested if the walk ran out of branches, which is
   * why it is reported rather than assumed.
   */
  readonly walk: readonly string[]
}

export interface RaceRequest {
  readonly jumps: number
  /**
   * A non-null seed makes the result deterministic: the same seed yields the
   * same race for everybody, which is what a daily challenge needs.
   */
  readonly seed: string | null
  /**
   * Start here instead of from a curated opening, so a won race can hand its
   * destination to the next one. Ignored if the article turns out to be too
   * thinly linked to race out of.
   */
  readonly from: string | null
}

/**
 * How much of the race is built. `done` counts finished round trips and can be
 * fractional while a step is being retried — a retry is real work, and a number
 * that sits still is indistinguishable from one that has frozen.
 */
export interface RaceProgress {
  readonly done: number
  readonly total: number
  readonly label: string
}

export interface BuildOptions {
  readonly signal?: AbortSignal
  readonly onProgress?: (progress: RaceProgress) => void
}

export interface RaceGenerator {
  /**
   * Builds a solvable pair by walking real links away from an opening article.
   */
  buildRacePair(request: RaceRequest, options?: BuildOptions): Promise<RacePair>
}
