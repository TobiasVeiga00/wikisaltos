import { RecentTitles } from '../../../shared/RecentTitles'
import { sameTitle, titleKey } from '../../../shared/titles'
import type { ArticleSummary } from '../../domain/Article'
import type { RaceGenerator, RacePair } from '../../domain/ports/RaceGenerator'
import { isDullTarget } from './dullTargets'
import { pickSeed } from './seeds'
import type { WikiGraph } from './WikiGraph'

/** Minimum outgoing links for an intermediate step, so the walk never dead-ends. */
const MIN_STEP_DEGREE = 20
/**
 * Ceiling on rejected branches. Retrying costs another round trip, and an
 * article whose links are mostly stubs could burn hundreds of them — which the
 * player experiences as a spinner that never ends.
 */
const MAX_STEP_RETRIES = 6
/** How many endings to look at before committing to one. */
const TARGET_CANDIDATES = 12
const MAX_TARGET_ROUNDS = 2
/** Openings to remember so the same seed does not come back within a session. */
const RECENT_ORIGIN_MEMORY = 20
/**
 * Endings to remember. Measured over 149 generated races the effective pool sits
 * around five thousand, so a repeat only becomes likely near the eightieth race
 * — but the memory is free and removes the annoying case of the same target
 * twice in an afternoon.
 */
const RECENT_TARGET_MEMORY = 40

/**
 * Builds a race by walking real links away from a seed article.
 *
 * The point is that the puzzle is generated from its own solution: because the
 * target was reached by following links, the walk is a valid path and an upper
 * bound on the shortest one, known before the clock starts. Everything here is
 * game policy — what makes a good opening, a fair ending, a walkable branch —
 * kept apart from the graph queries it leans on.
 */
export class WikipediaRaceGenerator implements RaceGenerator {
  private readonly recentOrigins = new RecentTitles(RECENT_ORIGIN_MEMORY)
  private readonly recentTargets = new RecentTitles(RECENT_TARGET_MEMORY)

  constructor(private readonly graph: WikiGraph) {}

  async buildRacePair(jumps: number, signal?: AbortSignal): Promise<RacePair> {
    const origin = pickSeed((title) => this.recentOrigins.has(title))
    this.recentOrigins.remember(origin)

    const walk = [origin]
    let links = await this.graph.sampleLinks(origin, signal)
    // A random walk can circle back into the origin's own neighbourhood. Those
    // targets are one click away, which makes for a race that is over before it
    // starts — and the origin's links are already in hand, so ruling them out
    // costs nothing.
    const oneClickAway = new Set(links.map(titleKey))

    // Every step except the last is taken blind: that is what makes the target
    // unpredictable. Only the ending is chosen with care.
    let retries = 0
    for (let step = 0; step < jumps - 1 && links.length > 0; step += 1) {
      const next = pickRandom(this.usable(links, walk))
      if (next === null) break

      const nextLinks = await this.graph.sampleLinks(next, signal)
      const thin = nextLinks.length < MIN_STEP_DEGREE
      if (nextLinks.length === 0 || (thin && retries < MAX_STEP_RETRIES)) {
        retries += 1
        links = links.filter((title) => title !== next)
        step -= 1
        continue
      }
      walk.push(next)
      links = nextLinks
    }

    const target = await this.pickTarget(links, walk, oneClickAway, signal)
    if (target === null) throw new Error('No se pudo armar una carrera. Probá de nuevo.')

    this.recentTargets.remember(target.title)
    walk.push(target.title)
    return { origin: { title: origin }, target, walk }
  }

  /**
   * Looks at a batch of possible endings and keeps the most recognisable one.
   * A thumbnail is the cheapest notability signal Wikipedia offers: obscure
   * stubs almost never have an image, well-known subjects almost always do.
   */
  private async pickTarget(
    links: string[],
    walk: string[],
    oneClickAway: ReadonlySet<string>,
    signal?: AbortSignal,
  ): Promise<ArticleSummary | null> {
    const usable = this.usable(links, walk)
    const distant = usable.filter((title) => !oneClickAway.has(titleKey(title)))
    let pool = distant.length > 0 ? distant : usable
    let fallback: ArticleSummary | null = null

    for (let round = 0; round < MAX_TARGET_ROUNDS && pool.length > 0; round += 1) {
      const candidates = sample(pool, TARGET_CANDIDATES)
      // Candidates are filtered again after the lookup, not only before it:
      // summaries resolve redirects, so a link with a different name can turn
      // out to be an article the walk already passed through — the origin
      // included, which would hand the player a race they have already won.
      const summaries = (await this.graph.summaries(candidates, signal)).filter(
        (summary) => !walk.some((seen) => sameTitle(seen, summary.title)),
      )
      const fresh = summaries.filter(
        (summary) => !isDullTarget(summary) && !this.recentTargets.has(summary.title),
      )

      const recognisable = fresh.find(
        (summary) => summary.thumbnailUrl !== null && summary.description !== null,
      )
      if (recognisable) return recognisable

      // A recently used or plain target still beats no target at all.
      fallback ??=
        fresh.find((summary) => summary.description !== null) ??
        fresh[0] ??
        summaries.find((summary) => summary.description !== null) ??
        summaries[0] ??
        null
      pool = pool.filter((title) => !candidates.includes(title))
    }

    return fallback
  }

  /** Drops anything already walked through, plus bare years, which make dull hops. */
  private usable(links: string[], walk: string[]): string[] {
    return links.filter(
      (title) => !/^\d{1,4}$/.test(title) && !walk.some((seen) => sameTitle(seen, title)),
    )
  }
}

function pickRandom(titles: string[]): string | null {
  return titles[Math.floor(Math.random() * titles.length)] ?? null
}

function sample(titles: string[], size: number): string[] {
  const remaining = [...titles]
  const picked: string[] = []
  while (picked.length < size && remaining.length > 0) {
    const [taken] = remaining.splice(Math.floor(Math.random() * remaining.length), 1)
    if (taken !== undefined) picked.push(taken)
  }
  return picked
}
