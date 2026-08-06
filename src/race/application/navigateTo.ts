import type { ArticleReader } from '../domain/ports/ArticleReader'
import { visit, type Race } from '../domain/Race'
import type { StartedRace } from './startRace'

/**
 * Loads the article first and only then records the move, because MediaWiki
 * resolves redirects during the fetch: clicking a link that redirects to the
 * target has to count as a win.
 */
export async function navigateTo(
  reader: ArticleReader,
  race: Race,
  title: string,
  now: number,
  signal?: AbortSignal,
): Promise<StartedRace> {
  const article = await reader.fetchArticle(title, signal)
  return { race: visit(race, article.title, now), article }
}
