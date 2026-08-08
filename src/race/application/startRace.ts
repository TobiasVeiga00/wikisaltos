import type { ArticleContent, ArticleReader } from '../domain/ports/ArticleReader'
import type { RaceGenerator, RaceProgress, RaceRequest } from '../domain/ports/RaceGenerator'
import { createRace, type Race } from '../domain/Race'

export interface StartedRace {
  readonly race: Race
  readonly article: ArticleContent
}

export interface StartOptions {
  readonly signal?: AbortSignal
  readonly onProgress?: (progress: RaceProgress) => void
}

const OPENING_ARTICLE = 'Abriendo el primer artículo'

/**
 * Building a race takes several round trips to Wikipedia. The clock is read
 * after them, never before: a timestamp taken when the player clicks would
 * charge them the loading time, which on a slow connection is a sizeable slice
 * of the race.
 *
 * Reading the opening article is one more trip than the generator plans for, so
 * its progress is reported against a total one larger than the one it reports.
 */
export async function startRace(
  generator: RaceGenerator,
  reader: ArticleReader,
  request: RaceRequest,
  limitMs: number,
  clock: () => number,
  options?: StartOptions,
): Promise<StartedRace> {
  const { signal, onProgress } = options ?? {}
  let built = 0

  const pair = await generator.buildRacePair(request, {
    ...(signal ? { signal } : {}),
    onProgress: (progress) => {
      built = progress.total
      onProgress?.({ ...progress, total: progress.total + 1 })
    },
  })

  onProgress?.({ done: built, total: built + 1, label: OPENING_ARTICLE })
  const article = await reader.fetchArticle(pair.origin.title, signal)
  onProgress?.({ done: built + 1, total: built + 1, label: OPENING_ARTICLE })

  const race = createRace(pair.origin, pair.target, pair.walk, limitMs, clock(), request.seed)
  return { race, article }
}
