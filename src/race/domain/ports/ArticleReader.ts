import type { ArticleContent } from '../Article'

export interface ArticleReader {
  fetchArticle(title: string, signal?: AbortSignal): Promise<ArticleContent>
}
