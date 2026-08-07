export interface ArticleRef {
  /** Canonical title after MediaWiki resolves redirects. */
  readonly title: string
}

/**
 * Enough context to recognise an article without opening it. A player told to
 * reach "Walberto Caicedo" is lost; told to reach an Ecuadorian footballer, they
 * can start thinking about football.
 */
export interface ArticleSummary extends ArticleRef {
  /** One-line label, e.g. "futbolista ecuatoriano". */
  readonly description: string | null
  /** First sentences of the article, plain text. Only used when there is no description. */
  readonly extract: string | null
  readonly thumbnailUrl: string | null
}

const MAX_LINE_LENGTH = 150

/**
 * The single line of context shown next to a target. Wikipedia's own short
 * description is almost always the better one — it is written to be read at a
 * glance — so the extract is only a fallback for articles that lack one.
 */
export function summaryLine(summary: ArticleSummary): string | null {
  if (summary.description !== null) return summary.description
  if (summary.extract === null) return null

  const sentenceEnd = summary.extract.indexOf('. ')
  const sentence = sentenceEnd === -1 ? summary.extract : summary.extract.slice(0, sentenceEnd + 1)
  return sentence.length > MAX_LINE_LENGTH
    ? `${sentence.slice(0, MAX_LINE_LENGTH).trimEnd()}…`
    : sentence
}
