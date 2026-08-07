import { describe, expect, it } from 'vitest'
import { ALL_SEEDS, pickSeed, type SeedChoice } from '../../src/race/infrastructure/wikipedia/seeds'

const atRandom: SeedChoice = {
  fraction: () => Math.random(),
  pick: (items) => items[Math.floor(Math.random() * items.length)],
}

describe('la lista de semillas', () => {
  // Un duplicado no rompe nada, solo hace que ese artículo salga el doble de
  // seguido que el resto. Es exactamente el tipo de error que se cuela al
  // agregar entradas a mano y que nadie nota jugando.
  it('no tiene títulos repetidos', () => {
    const repetidos = ALL_SEEDS.filter((t, i) => ALL_SEEDS.indexOf(t) !== i)
    expect(repetidos).toEqual([])
  })

  it('no tiene entradas vacías ni con espacios de más', () => {
    expect(ALL_SEEDS.filter((t) => t !== t.trim() || t === '')).toEqual([])
  })

  it('tiene suficientes para que los orígenes no se repitan seguido', () => {
    expect(ALL_SEEDS.length).toBeGreaterThan(150)
  })
})

describe('pickSeed', () => {
  it('devuelve una semilla de la lista', () => {
    expect(ALL_SEEDS).toContain(pickSeed(atRandom))
  })

  it('evita las usadas hace poco', () => {
    const usadas = new Set<string>()
    for (let i = 0; i < 40; i += 1) {
      const elegida = pickSeed({ ...atRandom, wasRecentlyUsed: (t) => usadas.has(t) })
      expect(usadas.has(elegida)).toBe(false)
      usadas.add(elegida)
    }
  })

  // Si todas están excluidas tiene que devolver algo igual: quedarse sin
  // carrera por no repetir un origen sería peor que repetirlo.
  it('devuelve una semilla aunque todas estén excluidas', () => {
    expect(ALL_SEEDS).toContain(pickSeed({ ...atRandom, wasRecentlyUsed: () => true }))
  })
})
