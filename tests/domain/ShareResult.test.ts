import { describe, expect, it } from 'vitest'
import type { ArticleSummary } from '../../src/race/domain/Article'
import { createRace, finish, visit, type Race } from '../../src/race/domain/Race'
import { shareResult } from '../../src/race/domain/ShareResult'

const PIZZA: ArticleSummary = {
  title: 'Pizza',
  description: 'plato italiano',
  extract: null,
  thumbnailUrl: null,
}

const T0 = 1_000_000
const race = (dayId: string | null = '2026-08-06'): Race =>
  createRace(
    { title: 'Diego Maradona' },
    PIZZA,
    ['Diego Maradona', 'Italia', 'Pizza'],
    300_000,
    T0,
    dayId,
  )

describe('shareResult', () => {
  it('encabeza con la fecha cuando es el desafío del día', () => {
    expect(shareResult(race(), 2)).toContain('Wikisaltos · 6 de agosto')
  })

  it('no inventa una fecha en una carrera al azar', () => {
    const texto = shareResult(race(null), 2)
    expect(texto.split('\n')[0]).toBe('Wikisaltos')
  })

  it('incluye el par para que se sepa qué carrera fue', () => {
    expect(shareResult(race(), 2)).toContain('Diego Maradona → Pizza')
  })

  it('cuenta los saltos y el tiempo al ganar', () => {
    const ganada = visit(visit(race(), 'Italia', T0 + 20_000), 'Pizza', T0 + 62_000)
    expect(shareResult(ganada, 2)).toContain('Llegué en 2 saltos y 1 min 2 s (mínimo: 2)')
  })

  it('lo dice sin vueltas cuando se acabó el tiempo', () => {
    expect(shareResult(finish(race(), 'timeout', T0 + 300_000), 2)).toContain(
      'Se me acabó el tiempo',
    )
  })

  it('lo dice sin vueltas cuando se abandonó', () => {
    expect(shareResult(finish(race(), 'surrendered', T0 + 9_000), 3)).toContain('Abandoné')
  })

  // Quien lo lee todavía no jugó: el recorrido arruinaría el desafío.
  it('no revela el camino', () => {
    const ganada = visit(visit(race(), 'Italia', T0 + 20_000), 'Pizza', T0 + 62_000)
    expect(shareResult(ganada, 2)).not.toContain('Italia')
  })

  it('incluye el enlace al juego', () => {
    expect(shareResult(race(), 2)).toContain('https://tobiasveiga00.github.io/wikisaltos/')
  })
})
