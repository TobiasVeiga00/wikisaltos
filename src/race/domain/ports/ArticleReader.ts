import type { ArticleRef } from '../Article'

export interface ArticleContent extends ArticleRef {
  /**
   * The article body, already sanitised and ready to be inserted.
   *
   * It is a live element rather than a string on purpose. Handing back HTML text
   * would mean the browser parses the article a second time when it is inserted,
   * and on a large article that measured around 150 ms of frozen main thread per
   * jump — time during which the game answers no clicks.
   *
   * The domain never looks inside it; only the viewer does. It lives on the port
   * because a port describes a boundary, and this one speaks to a browser.
   */
  readonly body: HTMLElement
}

export interface ArticleReader {
  fetchArticle(title: string, signal?: AbortSignal): Promise<ArticleContent>
}
