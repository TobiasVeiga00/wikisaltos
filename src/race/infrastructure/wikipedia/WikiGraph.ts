import { normalizeTitle } from '../../../shared/titles'
import type { ArticleSummary } from '../../domain/Article'
import { sliceToken } from './linkPaging'
import type { WikipediaApiClient } from './WikipediaApiClient'

interface LinksResponse {
  query?: {
    pages?: { pageid?: number; title: string; missing?: boolean; links?: { title: string }[] }[]
  }
  continue?: Record<string, string>
}

interface BacklinksResponse {
  query?: { backlinks?: { title: string }[] }
  continue?: Record<string, string>
}

interface SummaryResponse {
  query?: {
    pages?: {
      title: string
      missing?: boolean
      description?: string
      extract?: string
      thumbnail?: { source: string }
    }[]
  }
}

/**
 * Reading Wikipedia's link graph. Knows about paging, continuation tokens and
 * response shapes, and nothing about races: what a good starting article is, or
 * when a path counts as short, is decided elsewhere.
 */
export class WikiGraph {
  constructor(private readonly client: WikipediaApiClient) {}

  /**
   * The pool of links a walk can jump to.
   *
   * `prop=links` returns titles in alphabetical order, so the first page of a
   * well-linked article never leaves the early letters — "Buenos Aires" has 1247
   * links and page one stops at E, which made every jump from it land in A–E.
   * Paging through everything fixes the bias but costs six requests a hop and
   * trips Wikimedia's rate limiter, so this takes the first page plus one slice
   * starting past where it ended. Two requests, and the second always reaches
   * ground the first could not.
   */
  async sampleLinks(title: string, sliceAt: number, signal?: AbortSignal): Promise<string[]> {
    const query = { action: 'query', prop: 'links', titles: title, plnamespace: 0, pllimit: 'max' }
    const first = await this.client.request<LinksResponse>(query, signal)
    const page = first.query?.pages?.[0]
    if (!page || page.missing) return []

    const titles = (page.links ?? []).map((link) => normalizeTitle(link.title))
    const lastTitle = titles[titles.length - 1]
    if (!first.continue || page.pageid === undefined || lastTitle === undefined) return titles

    const slice = await this.client.request<LinksResponse>(
      { ...query, plcontinue: sliceToken(page.pageid, lastTitle, sliceAt) },
      signal,
    )
    for (const link of slice.query?.pages?.[0]?.links ?? []) titles.push(normalizeTitle(link.title))
    return [...new Set(titles)]
  }

  async allOutgoing(title: string, maxPages: number, signal?: AbortSignal): Promise<string[]> {
    const titles: string[] = []
    let cursor: Record<string, string> = {}
    for (let page = 0; page < maxPages; page += 1) {
      const response = await this.client.request<LinksResponse>(
        {
          action: 'query',
          prop: 'links',
          titles: title,
          plnamespace: 0,
          pllimit: 'max',
          ...cursor,
        },
        signal,
      )
      const first = response.query?.pages?.[0]
      if (!first || first.missing) break
      for (const link of first.links ?? []) titles.push(normalizeTitle(link.title))
      if (!response.continue) break
      cursor = response.continue
    }
    return titles
  }

  async allIncoming(title: string, maxPages: number, signal?: AbortSignal): Promise<string[]> {
    const titles: string[] = []
    let cursor: Record<string, string> = {}
    for (let page = 0; page < maxPages; page += 1) {
      const response = await this.client.request<BacklinksResponse>(
        {
          action: 'query',
          list: 'backlinks',
          bltitle: title,
          blnamespace: 0,
          blfilterredir: 'nonredirects',
          bllimit: 'max',
          ...cursor,
        },
        signal,
      )
      for (const link of response.query?.backlinks ?? []) titles.push(normalizeTitle(link.title))
      if (!response.continue) break
      cursor = response.continue
    }
    return titles
  }

  /** Description, first sentences and thumbnail for a batch of articles, in one request. */
  async summaries(titles: string[], signal?: AbortSignal): Promise<ArticleSummary[]> {
    if (titles.length === 0) return []
    const response = await this.client.request<SummaryResponse>(
      {
        action: 'query',
        prop: 'extracts|pageimages|description',
        titles: titles.join('|'),
        exintro: 1,
        explaintext: 1,
        exsentences: 2,
        piprop: 'thumbnail',
        pithumbsize: 200,
        redirects: 1,
      },
      signal,
    )

    return (response.query?.pages ?? [])
      .filter((page) => !page.missing)
      .map((page) => {
        // An article with no intro comes back as an empty string, which reads as
        // "there is a summary" everywhere downstream unless it becomes null here.
        const extract = page.extract?.trim()
        return {
          title: normalizeTitle(page.title),
          description: page.description ?? null,
          extract: extract === undefined || extract === '' ? null : extract,
          thumbnailUrl: page.thumbnail?.source ?? null,
        }
      })
  }
}
