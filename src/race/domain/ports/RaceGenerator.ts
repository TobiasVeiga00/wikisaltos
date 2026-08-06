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

export interface RaceGenerator {
  /** Builds a solvable pair by walking `jumps` real links away from a seed article. */
  buildRacePair(jumps: number, signal?: AbortSignal): Promise<RacePair>
}
