import { RecentTitles } from '../../../shared/RecentTitles'
import { sameTitle, titleKey } from '../../../shared/titles'
import type { ArticleSummary } from '../../domain/Article'
import type {
  BuildOptions,
  RaceGenerator,
  RacePair,
  RaceProgress,
  RaceRequest,
} from '../../domain/ports/RaceGenerator'
import { isDullTarget } from './dullTargets'
import { choicesFor, type RaceChoices } from './raceChoices'
import { pickSeed } from './seeds'
import type { WikiGraph } from './WikiGraph'

/** Minimum outgoing links for an intermediate step, so the walk never dead-ends. */
const MIN_STEP_DEGREE = 20
/**
 * Minimum outgoing links to open a race with. Curated seeds clear this by a wide
 * margin, so it only ever bites on a chained opening: a destination is chosen
 * for being recognisable, which says nothing about how many ways lead out of it.
 */
const MIN_ORIGIN_DEGREE = 40
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
 *
 * Given a seed the whole thing turns deterministic, which is what makes a daily
 * challenge possible. The session memories are skipped in that case: what one
 * player saw yesterday must not change the race everyone gets today.
 */
export class WikipediaRaceGenerator implements RaceGenerator {
  private readonly recentOrigins = new RecentTitles(RECENT_ORIGIN_MEMORY)
  private readonly recentTargets = new RecentTitles(RECENT_TARGET_MEMORY)

  constructor(private readonly graph: WikiGraph) {}

  async buildRacePair(request: RaceRequest, options?: BuildOptions): Promise<RacePair> {
    const { jumps, seed, from } = request
    const { signal, onProgress } = options ?? {}
    const choices = choicesFor(seed)
    const shared = seed !== null

    // One round trip to open, one per intermediate step, one to choose the
    // ending. The caller adds its own for the article itself.
    const progress = progressTracker(jumps + 1, onProgress)
    progress.begin(OPENING)

    let origin = from ?? this.freshSeed(choices, shared)
    let links = await this.graph.sampleLinks(origin, choices.fraction('slice 0'), signal)
    progress.step(WALKING)

    // A destination earned its place by being recognisable, which says nothing
    // about how many ways lead out of it. Racing out of a dead end is worse than
    // breaking the chain, so a thin opening falls back to a curated one.
    if (from !== null && links.length < MIN_ORIGIN_DEGREE) {
      origin = this.freshSeed(choices, shared)
      links = await this.graph.sampleLinks(origin, choices.fraction('slice 0'), signal)
      progress.unplanned(WALKING)
    }

    const walk = [origin]
    // A random walk can circle back into the origin's own neighbourhood. Those
    // targets are one click away, which makes for a race that is over before it
    // starts — and the origin's links are already in hand, so ruling them out
    // costs nothing.
    const oneClickAway = new Set(links.map(titleKey))

    // Every step except the last is taken blind: that is what makes the target
    // unpredictable. Only the ending is chosen with care.
    let retries = 0
    for (let step = 0; step < jumps - 1 && links.length > 0; step += 1) {
      const next = choices.pick(this.usable(links, walk), `step ${step} try ${retries}`)
      if (next === undefined) break

      const nextLinks = await this.graph.sampleLinks(
        next,
        choices.fraction(`slice ${step + 1}`),
        signal,
      )
      const thin = nextLinks.length < MIN_STEP_DEGREE
      if (nextLinks.length === 0 || (thin && retries < MAX_STEP_RETRIES)) {
        retries += 1
        // A rejected branch cost a real round trip, so it counts as one — and
        // the estimate grows with it. That is what keeps the number moving
        // through a run of bad luck instead of sitting still.
        progress.unplanned(WALKING)
        links = links.filter((title) => title !== next)
        step -= 1
        continue
      }
      walk.push(next)
      links = nextLinks
      progress.step(step === jumps - 2 ? CHOOSING : WALKING)
    }

    const target = await this.pickTarget(links, walk, oneClickAway, choices, shared, signal)
    progress.step(CHOOSING)
    if (target === null) throw new Error('No se pudo armar una carrera. Probá de nuevo.')

    if (!shared) this.recentTargets.remember(target.title)
    walk.push(target.title)
    return { origin: { title: origin }, target, walk }
  }

  private freshSeed(choices: RaceChoices, shared: boolean): string {
    const origin = pickSeed({
      fraction: (salt) => choices.fraction(salt),
      pick: (items, salt) => choices.pick(items, salt),
      ...(shared ? {} : { wasRecentlyUsed: (title) => this.recentOrigins.has(title) }),
    })
    if (!shared) this.recentOrigins.remember(origin)
    return origin
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
    choices: RaceChoices,
    shared: boolean,
    signal?: AbortSignal,
  ): Promise<ArticleSummary | null> {
    const usable = this.usable(links, walk)
    const distant = usable.filter((title) => !oneClickAway.has(titleKey(title)))
    let pool = distant.length > 0 ? distant : usable
    let fallback: ArticleSummary | null = null

    for (let round = 0; round < MAX_TARGET_ROUNDS && pool.length > 0; round += 1) {
      const candidates = choices.sample(pool, `target ${round}`, TARGET_CANDIDATES)
      // Candidates are filtered again after the lookup, not only before it:
      // summaries resolve redirects, so a link with a different name can turn
      // out to be an article the walk already passed through — the origin
      // included, which would hand the player a race they have already won.
      const summaries = (await this.graph.summaries(candidates, signal)).filter(
        (summary) => !walk.some((seen) => sameTitle(seen, summary.title)),
      )
      const fresh = summaries.filter(
        (summary) => !isDullTarget(summary) && (shared || !this.recentTargets.has(summary.title)),
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

const OPENING = 'Buscando por dónde empezar'
const WALKING = 'Saltando de enlace en enlace'
const CHOOSING = 'Eligiendo el destino'

/**
 * Progress measured in finished round trips, never in elapsed time.
 *
 * The estimate is honest but not exact — a rejected branch costs a trip nobody
 * planned for. Rather than stall on a fixed denominator, an unplanned trip
 * raises both numbers at once, which always moves the fraction forward (`done`
 * is below `total`, so `(d+1)/(t+1)` beats `d/t`) while admitting there is more
 * left than we thought.
 */
function progressTracker(planned: number, onProgress?: (progress: RaceProgress) => void) {
  let done = 0
  let total = planned
  const emit = (label: string) => {
    onProgress?.({ done, total, label })
  }
  return {
    begin: (label: string) => {
      emit(label)
    },
    step: (label: string) => {
      done += 1
      emit(label)
    },
    unplanned: (label: string) => {
      done += 1
      total += 1
      emit(label)
    },
  }
}
