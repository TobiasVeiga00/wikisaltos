import type { ArticleContent, ArticleReader } from '../domain/ports/ArticleReader'
import type { RaceGenerator } from '../domain/ports/RaceGenerator'
import { createRace, type Race } from '../domain/Race'

export interface StartedRace {
  readonly race: Race
  readonly article: ArticleContent
}

/**
 * Building a race takes several round trips to Wikipedia. The clock is read
 * after them, never before: a timestamp taken when the player clicks would
 * charge them the loading time, which on a slow connection is a sizeable slice
 * of the race.
 */
export async function startRace(
  generator: RaceGenerator,
  reader: ArticleReader,
  jumps: number,
  limitMs: number,
  clock: () => number,
  dayId: string | null,
  signal?: AbortSignal,
): Promise<StartedRace> {
  const pair = await generator.buildRacePair(jumps, dayId, signal)
  const article = await reader.fetchArticle(pair.origin.title, signal)
  const race = createRace(pair.origin, pair.target, pair.walk, limitMs, clock(), dayId)
  return { race, article }
}
