import { describe, expect, it } from 'vitest'
import type { ArticleSummary } from '../../src/race/domain/Article'
import type { RaceProgress } from '../../src/race/domain/ports/RaceGenerator'
import { WikipediaRaceGenerator } from '../../src/race/infrastructure/wikipedia/WikipediaRaceGenerator'
import type { WikiGraph } from '../../src/race/infrastructure/wikipedia/WikiGraph'

const summary = (title: string): ArticleSummary => ({
  title,
  description: 'algo',
  extract: 'algo',
  thumbnailUrl: 'https://example.org/x.png',
})

/**
 * Un grafo de mentira con grado configurable por artículo, para poder forzar
 * ramas flacas — que es cuando el generador reintenta, y el momento exacto en
 * que el número podría quedarse quieto.
 */
function fakeGraph(degreeOf: (title: string) => number): WikiGraph {
  const linksOf = (title: string) =>
    Array.from({ length: degreeOf(title) }, (_, i) => `${title}-enlace-${String(i)}`)
  return {
    sampleLinks: (title: string) => Promise.resolve(linksOf(title)),
    summaries: (titles: string[]) => Promise.resolve(titles.map(summary)),
    allOutgoing: () => Promise.resolve([]),
    allIncoming: () => Promise.resolve([]),
  } as unknown as WikiGraph
}

const build = async (graph: WikiGraph, from: string | null = null) => {
  const seen: RaceProgress[] = []
  const generator = new WikipediaRaceGenerator(graph)
  const pair = await generator.buildRacePair(
    { jumps: 3, seed: null, from },
    {
      onProgress: (progress) => {
        seen.push(progress)
      },
    },
  )
  return { pair, seen, percents: seen.map((p) => Math.round((p.done / p.total) * 100)) }
}

const RICO = 500

describe('el avance al armar una carrera', () => {
  it('nunca retrocede', async () => {
    const { percents } = await build(fakeGraph(() => RICO))
    expect(percents).toEqual([...percents].sort((a, b) => a - b))
  })

  it('empieza en cero y termina en cien', async () => {
    const { percents } = await build(fakeGraph(() => RICO))
    expect(percents[0]).toBe(0)
    expect(percents.at(-1)).toBe(100)
  })

  // Sin esto, el jugador ve el mismo número durante varios segundos y asume
  // que se colgó — que es justamente el problema que la barra vino a resolver.
  it('sigue avanzando aunque el generador descarte ramas flacas', async () => {
    // Todo lo que sale del primer salto es un artículo pobre, así que el
    // generador tiene que reintentar varias veces antes de encontrar salida.
    let flacos = 0
    const graph = fakeGraph((title) => {
      if (title.startsWith('paso-1')) return RICO
      if (title.includes('-enlace-') && flacos++ < 4) return 1
      return RICO
    })

    const { percents } = await build(graph)

    expect(percents).toEqual([...percents].sort((a, b) => a - b))
    // Cada reintento es un viaje terminado, así que produce su propio avance.
    expect(new Set(percents).size).toBeGreaterThan(4)
  })
})

describe('encadenar una carrera con la anterior', () => {
  it('arranca en el destino que se le pasa', async () => {
    const { pair } = await build(
      fakeGraph(() => RICO),
      'Murcia',
    )
    expect(pair.origin.title).toBe('Murcia')
    expect(pair.walk[0]).toBe('Murcia')
  })

  // Un destino se elige por reconocible, no por tener salidas. Arrancar en un
  // callejón sin salida es peor que cortar la cadena.
  it('descarta un origen encadenado con pocos enlaces', async () => {
    const graph = fakeGraph((title) => (title === 'Cuadro Oscuro' ? 5 : RICO))
    const { pair } = await build(graph, 'Cuadro Oscuro')
    expect(pair.origin.title).not.toBe('Cuadro Oscuro')
  })

  it('cobra el viaje extra del descarte en vez de esconderlo', async () => {
    const graph = fakeGraph((title) => (title === 'Cuadro Oscuro' ? 5 : RICO))
    const { seen, percents } = await build(graph, 'Cuadro Oscuro')
    const normal = await build(
      fakeGraph(() => RICO),
      'Murcia',
    )

    expect(seen.at(-1)?.total).toBeGreaterThan(normal.seen.at(-1)?.total ?? 0)
    expect(percents).toEqual([...percents].sort((a, b) => a - b))
  })
})
