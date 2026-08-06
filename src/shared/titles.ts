/**
 * MediaWiki treats "Lionel_Messi", "Lionel Messi" and "lionel messi" as the same
 * article, and hrefs arrive percent-encoded. Every title comparison in the app
 * goes through here so the rest of the code never has to care.
 */
export function normalizeTitle(raw: string): string {
  let decoded = raw
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    // A literal "%" in the title makes decodeURIComponent throw. Keep the raw value.
  }
  return decoded.replace(/_/g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * The comparable form of a title. Exposed so lookups can key a Set or a Map by
 * it instead of scanning with `sameTitle`, which would otherwise be two ways of
 * asking the same question — and two chances to answer it differently.
 */
export function titleKey(title: string): string {
  return normalizeTitle(title).toLocaleLowerCase('es')
}

export function sameTitle(a: string, b: string): boolean {
  return titleKey(a) === titleKey(b)
}
