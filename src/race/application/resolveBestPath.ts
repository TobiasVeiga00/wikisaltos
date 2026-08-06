import type { PathFinder } from '../domain/ports/PathFinder'
import type { Race } from '../domain/Race'

/**
 * The race was built by walking N real links, so `knownPath` is already a valid
 * solution and an upper bound. A bounded two-jump search is all the public API
 * can afford, and it is exactly what can beat that bound — so we run it and keep
 * whichever is shorter. If Wikipedia rate limits us, the walk still gives the
 * player a real answer instead of an error.
 */
export async function resolveBestPath(
  finder: PathFinder,
  race: Race,
  signal?: AbortSignal,
): Promise<readonly string[]> {
  try {
    const found = await finder.findShortPath(race.origin.title, race.target.title, signal)
    if (found !== null && found.length < race.knownPath.length) return found
  } catch {
    // Fall through to the walk we already know is valid.
  }
  return race.knownPath
}
