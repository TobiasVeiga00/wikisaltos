/**
 * @vitest-environment jsdom
 *
 * Comprobación contra la API real: verifica la promesa central del desafío
 * diario, que es que todo el mundo juegue exactamente la misma carrera.
 *
 * Vive fuera de la suite normal porque depende de la red. Si Wikipedia está
 * limitando las peticiones falla con "Wikipedia está limitando las peticiones",
 * que no es un problema de determinismo: el generador falla cerrado, tira error
 * en vez de devolver una carrera distinta. Esperá un rato y volvé a correrla.
 *
 *   npm run test:integration
 */
import { describe, expect, it } from 'vitest'
import { WikiGraph } from '../../src/race/infrastructure/wikipedia/WikiGraph'
import { WikipediaApiClient } from '../../src/race/infrastructure/wikipedia/WikipediaApiClient'
import { WikipediaRaceGenerator } from '../../src/race/infrastructure/wikipedia/WikipediaRaceGenerator'

describe('desafío diario contra la API real', () => {
  it(
    'dos generadores distintos producen la misma carrera para el mismo día',
    { timeout: 120_000 },
    async () => {
      const nuevo = () => new WikipediaRaceGenerator(new WikiGraph(new WikipediaApiClient()))

      const a = await nuevo().buildRacePair(3, '2026-08-06')
      const b = await nuevo().buildRacePair(3, '2026-08-06')

      console.log('  A:', a.walk.join(' > '))
      console.log('  B:', b.walk.join(' > '))

      expect(b.origin.title).toBe(a.origin.title)
      expect(b.target.title).toBe(a.target.title)
      expect(b.walk).toEqual(a.walk)
    },
  )

  it('otro día da otra carrera', { timeout: 120_000 }, async () => {
    const generador = new WikipediaRaceGenerator(new WikiGraph(new WikipediaApiClient()))
    const hoy = await generador.buildRacePair(3, '2026-08-06')
    const mañana = await generador.buildRacePair(3, '2026-08-07')
    console.log('  06:', hoy.walk.join(' > '))
    console.log('  07:', mañana.walk.join(' > '))
    expect(mañana.target.title).not.toBe(hoy.target.title)
  })
})
