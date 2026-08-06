import { describe, expect, it } from 'vitest'
import type { ArticleSummary } from '../../src/race/domain/Article'
import {
  createRace,
  elapsedMs,
  finish,
  isOver,
  jumps,
  remainingMs,
  visit,
} from '../../src/race/domain/Race'

const LA_PAZ: ArticleSummary = {
  title: 'La Paz',
  description: 'ciudad de Bolivia',
  extract: 'La Paz es la sede de gobierno de Bolivia.',
  thumbnailUrl: 'https://example.org/la-paz.jpg',
}

const T0 = 1_000_000
const LIMIT = 300_000
const newRace = () =>
  createRace({ title: 'Bolivia' }, LA_PAZ, ['Bolivia', 'Sucre', 'La Paz'], LIMIT, T0)

describe('createRace', () => {
  it('empieza sin resultado y con el origen como único paso', () => {
    const race = newRace()
    expect(race.outcome).toBeNull()
    expect(isOver(race)).toBe(false)
    expect(race.path).toEqual(['Bolivia'])
  })

  it('no cuenta el origen como salto', () => {
    expect(jumps(newRace())).toBe(0)
  })
})

describe('visit', () => {
  it('avanza sin ganar cuando el artículo no es el destino', () => {
    const race = visit(newRace(), 'Sucre', T0 + 5_000)
    expect(race.outcome).toBeNull()
    expect(jumps(race)).toBe(1)
  })

  it('gana al llegar al destino y congela el reloj', () => {
    const race = visit(visit(newRace(), 'Sucre', T0 + 5_000), 'La Paz', T0 + 9_000)
    expect(race.outcome).toBe('won')
    expect(race.finishedAt).toBe(T0 + 9_000)
    expect(jumps(race)).toBe(2)
  })

  it('gana aunque el enlace traiga el título en otra forma', () => {
    expect(visit(newRace(), 'la_paz', T0 + 1_000).outcome).toBe('won')
  })

  it('ignora movimientos sobre una carrera terminada', () => {
    const won = visit(newRace(), 'La Paz', T0 + 1_000)
    expect(visit(won, 'Argentina', T0 + 20_000)).toBe(won)
  })
})

describe('finish', () => {
  it('termina la carrera con el resultado dado', () => {
    expect(finish(newRace(), 'surrendered', T0 + 30_000).outcome).toBe('surrendered')
  })

  it('no permite terminar dos veces', () => {
    const over = finish(newRace(), 'surrendered', T0 + 30_000)
    expect(finish(over, 'timeout', T0 + 40_000)).toBe(over)
  })
})

describe('reloj', () => {
  it('descuenta el tiempo transcurrido', () => {
    expect(remainingMs(newRace(), T0 + 100_000)).toBe(200_000)
  })

  it('nunca devuelve tiempo negativo', () => {
    expect(remainingMs(newRace(), T0 + 999_000)).toBe(0)
  })

  it('queda congelado después de terminar', () => {
    const won = visit(newRace(), 'La Paz', T0 + 9_000)
    expect(remainingMs(won, T0 + 999_000)).toBe(LIMIT - 9_000)
  })

  it('una carrera sin terminar todavía no consumió tiempo', () => {
    expect(elapsedMs(newRace())).toBe(0)
  })

  it('el tiempo usado es el que llevó terminarla', () => {
    expect(elapsedMs(visit(newRace(), 'La Paz', T0 + 9_000))).toBe(9_000)
  })

  it('el tiempo usado nunca supera el límite', () => {
    expect(elapsedMs(finish(newRace(), 'timeout', T0 + 999_000))).toBe(LIMIT)
  })
})
