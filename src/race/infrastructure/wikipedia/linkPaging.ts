const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

/**
 * A random letter past the one a page of links ended on. Picks lean toward the
 * letters right after the cut, because those slices hold the most titles —
 * starting at V leaves only a handful of links to choose from.
 */
function letterAfter(lastTitle: string): string {
  const index = ALPHABET.indexOf(lastTitle.charAt(0).toUpperCase())
  const from = index === -1 ? 0 : Math.min(index + 1, ALPHABET.length - 1)
  const spread = ALPHABET.length - from
  return ALPHABET.charAt(from + Math.floor(Math.random() ** 2 * spread))
}

/**
 * A `plcontinue` token that resumes a link listing somewhere past `lastTitle`.
 *
 * `prop=links` returns titles alphabetically, 500 at a time, so the first page
 * of a well-linked article never leaves the early letters — "Buenos Aires" has
 * 1247 links and page one stops at E. The token format is documented as
 * `pageid|namespace|title`, which means it can be built instead of waited for:
 * one extra request reaches a slice the first page could not.
 */
export function randomSliceToken(pageId: number, lastTitle: string): string {
  return `${pageId}|0|${letterAfter(lastTitle)}`
}
