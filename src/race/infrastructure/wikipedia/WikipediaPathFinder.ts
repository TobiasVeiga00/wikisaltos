import { titleKey } from '../../../shared/titles'
import type { PathFinder } from '../../domain/ports/PathFinder'
import type { WikiGraph } from './WikiGraph'

/**
 * The search runs once, when a race ends, so it can afford full coverage of both
 * frontiers. Each page is up to 500 titles.
 */
const CONTINUATION_PAGES = 6

/**
 * Bidirectional search bounded to two jumps: the links out of the origin and the
 * links into the target, meeting in the middle.
 *
 * Two jumps is not an arbitrary depth, it is what the public API can afford.
 * Certifying three would mean expanding a frontier of roughly a thousand
 * articles at 500 links per request — some five hundred calls, against a
 * limiter that starts refusing well before that.
 */
export class WikipediaPathFinder implements PathFinder {
  constructor(private readonly graph: WikiGraph) {}

  async findShortPath(
    origin: string,
    target: string,
    signal?: AbortSignal,
  ): Promise<readonly string[] | null> {
    const outgoing = await this.graph.allOutgoing(origin, CONTINUATION_PAGES, signal)
    const targetKey = titleKey(target)
    if (outgoing.some((title) => titleKey(title) === targetKey)) return [origin, target]

    const incoming = await this.graph.allIncoming(target, CONTINUATION_PAGES, signal)
    const originKey = titleKey(origin)
    if (incoming.some((title) => titleKey(title) === originKey)) return [origin, target]

    const reachesTarget = new Set(incoming.map(titleKey))
    const meeting = outgoing.find((title) => reachesTarget.has(titleKey(title)))
    return meeting === undefined ? null : [origin, meeting, target]
  }
}
