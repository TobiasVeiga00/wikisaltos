import { describe, expect, it } from 'vitest'
import { formatClock, formatElapsed } from '../../src/shared/time'

describe('formatClock', () => {
  it.each([
    [300_000, '5:00'],
    [61_000, '1:01'],
    [9_000, '0:09'],
    [0, '0:00'],
  ])('muestra %i ms como %s', (ms, esperado) => {
    expect(formatClock(ms)).toBe(esperado)
  })

  // El reloj de una cuenta regresiva redondea hacia arriba: mientras quede algo
  // de tiempo tiene que mostrar al menos un segundo, no cero.
  it('no muestra cero mientras todavía queda tiempo', () => {
    expect(formatClock(1)).toBe('0:01')
  })

  it('nunca muestra tiempo negativo', () => {
    expect(formatClock(-5_000)).toBe('0:00')
  })
})

describe('formatElapsed', () => {
  it.each([
    [9_000, '9 s'],
    [61_000, '1 min 1 s'],
    [125_000, '2 min 5 s'],
    [0, '0 s'],
  ])('muestra %i ms como %s', (ms, esperado) => {
    expect(formatElapsed(ms)).toBe(esperado)
  })

  it('omite los minutos cuando no hay', () => {
    expect(formatElapsed(30_000)).not.toContain('min')
  })
})
