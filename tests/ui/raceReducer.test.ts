import { describe, expect, it } from 'vitest'
import type { ArticleContent, ArticleSummary } from '../../src/race/domain/Article'
import { createRace, finish, visit, type Race } from '../../src/race/domain/Race'
import {
  INITIAL_RACE_STATE,
  raceReducer,
  type RaceAction,
  type RaceState,
} from '../../src/race/ui/hooks/useRace'

const TARGET: ArticleSummary = {
  title: 'La Paz',
  description: 'ciudad de Bolivia',
  extract: null,
  thumbnailUrl: null,
}

const article = (title: string): ArticleContent => ({ title, html: `<p>${title}</p>` })
const newRace = (startedAt = 1_000): Race =>
  createRace({ title: 'Bolivia' }, TARGET, ['Bolivia', 'Sucre', 'La Paz'], 300_000, startedAt)

const reduce = (state: RaceState, ...actions: RaceAction[]): RaceState =>
  actions.reduce(raceReducer, state)

const racing = (race = newRace()) =>
  reduce(INITIAL_RACE_STATE, { type: 'STARTED', race, article: article('Bolivia') })

const wonOnce = () => {
  const race = newRace()
  return reduce(racing(race), {
    type: 'MOVED',
    race: visit(race, 'La Paz', 2_000),
    article: article('La Paz'),
  })
}

describe('preparar la carrera siguiente', () => {
  // El botón "Otra carrera" limpiaba el estado y devolvía al menú de inicio.
  it('deja la carrera anterior en pantalla mientras arma la próxima', () => {
    const state = reduce(wonOnce(), { type: 'PREPARING' })
    expect(state.phase).toBe('preparing')
    expect(state.race).not.toBeNull()
    expect(state.article).not.toBeNull()
  })

  it('descarta el camino más corto de la carrera anterior al empezar la nueva', () => {
    const state = reduce(
      wonOnce(),
      { type: 'BEST_PATH', path: ['Bolivia', 'La Paz'] },
      { type: 'PREPARING' },
      { type: 'STARTED', race: newRace(9_000), article: article('Otro') },
    )
    expect(state.bestPath).toBeNull()
    expect(state.phase).toBe('racing')
  })
})

describe('racha', () => {
  it('avanza al ganar', () => {
    expect(wonOnce().streak.count).toBe(1)
  })

  it('se corta al abandonar', () => {
    const race = newRace()
    const state = reduce(
      { ...wonOnce(), race, phase: 'racing' },
      { type: 'FINISHED', race: finish(race, 'surrendered', 3_000) },
    )
    expect(state.streak).toEqual({ count: 0, brokenAt: 1 })
  })

  it('sobrevive a empezar una carrera nueva', () => {
    const state = reduce(
      wonOnce(),
      { type: 'PREPARING' },
      { type: 'STARTED', race: newRace(9_000), article: article('Otro') },
    )
    expect(state.streak.count).toBe(1)
  })

  // Volver al menú es navegación, no una derrota.
  it('sobrevive a volver al inicio', () => {
    const state = reduce(wonOnce(), { type: 'HOME' })
    expect(state.phase).toBe('idle')
    expect(state.race).toBeNull()
    expect(state.streak.count).toBe(1)
  })

  it('no cuenta dos veces la misma carrera', () => {
    const race = newRace()
    const won = visit(race, 'La Paz', 2_000)
    const state = reduce(
      racing(race),
      { type: 'MOVED', race: won, article: article('La Paz') },
      // Un intento tardío de terminar una carrera ya ganada no debe sumar.
      { type: 'FINISHED', race: won },
    )
    expect(state.streak.count).toBe(1)
  })

  it('no se mueve mientras la carrera sigue en juego', () => {
    const race = newRace()
    const state = reduce(racing(race), {
      type: 'MOVED',
      race: visit(race, 'Sucre', 2_000),
      article: article('Sucre'),
    })
    expect(state.phase).toBe('racing')
    expect(state.streak.count).toBe(0)
  })
})

describe('errores', () => {
  it('vuelve al inicio si falla antes de existir una carrera', () => {
    const state = reduce(
      INITIAL_RACE_STATE,
      { type: 'PREPARING' },
      { type: 'FAILED', message: 'x' },
    )
    expect(state.phase).toBe('idle')
    expect(state.error).toBe('x')
  })

  it('mantiene la carrera en curso si falla un salto', () => {
    const state = reduce(racing(), { type: 'LOADING_ARTICLE' }, { type: 'FAILED', message: 'x' })
    expect(state.phase).toBe('racing')
    expect(state.loadingArticle).toBe(false)
  })

  it('limpia el error al intentar el salto siguiente', () => {
    const state = reduce(racing(), { type: 'FAILED', message: 'x' }, { type: 'LOADING_ARTICLE' })
    expect(state.error).toBeNull()
  })
})
