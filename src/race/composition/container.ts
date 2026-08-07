import { LocalStoragePlayerStore } from '../infrastructure/storage/LocalStoragePlayerStore'
import { WikiGraph } from '../infrastructure/wikipedia/WikiGraph'
import { WikipediaApiClient } from '../infrastructure/wikipedia/WikipediaApiClient'
import { WikipediaArticleReader } from '../infrastructure/wikipedia/WikipediaArticleReader'
import { WikipediaPathFinder } from '../infrastructure/wikipedia/WikipediaPathFinder'
import { WikipediaRaceGenerator } from '../infrastructure/wikipedia/WikipediaRaceGenerator'
import type { RacePorts } from '../ui/hooks/useRace'

/**
 * Composition root: the only place that knows which adapter answers which port.
 * One client throttles every request, and one graph is shared by the two things
 * that read it — generating a race and searching for the shortest path.
 */
const client = new WikipediaApiClient()
const graph = new WikiGraph(client)

export const wikipediaPorts: RacePorts = {
  generator: new WikipediaRaceGenerator(graph),
  reader: new WikipediaArticleReader(client),
  finder: new WikipediaPathFinder(graph),
  records: new LocalStoragePlayerStore(),
}

export const RACE_JUMPS = 3
export const RACE_LIMIT_MS = 5 * 60 * 1000
