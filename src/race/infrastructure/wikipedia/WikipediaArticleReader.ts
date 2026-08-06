import { normalizeTitle } from '../../../shared/titles'
import type { ArticleContent } from '../../domain/Article'
import type { ArticleReader } from '../../domain/ports/ArticleReader'
import { sanitizeArticleHtml } from './sanitizeArticleHtml'
import type { WikipediaApiClient } from './WikipediaApiClient'

interface ParseResponse {
  parse?: { title: string; text: string }
}

export class WikipediaArticleReader implements ArticleReader {
  constructor(private readonly client: WikipediaApiClient) {}

  async fetchArticle(title: string, signal?: AbortSignal): Promise<ArticleContent> {
    const response = await this.client.request<ParseResponse>(
      { action: 'parse', page: title, prop: 'text', redirects: 1 },
      signal,
    )
    if (!response.parse) throw new Error(`No se pudo cargar el artículo "${title}"`)

    // The title comes back canonical after redirects, which is what makes a link
    // that redirects to the target count as a win.
    return {
      title: normalizeTitle(response.parse.title),
      html: sanitizeArticleHtml(response.parse.text),
    }
  }
}
