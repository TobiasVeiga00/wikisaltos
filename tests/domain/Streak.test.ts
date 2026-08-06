import { describe, expect, it } from 'vitest'
import { afterRace, NO_STREAK, type Streak } from '../../src/race/domain/Streak'

const win = (times: number): Streak =>
  Array.from({ length: times }).reduce<Streak>((streak) => afterRace(streak, 'won'), NO_STREAK)

describe('afterRace', () => {
  it('abre la racha con la primera victoria', () => {
    expect(afterRace(NO_STREAK, 'won')).toEqual({ count: 1, brokenAt: null })
  })

  it('encadena victorias', () => {
    expect(win(3).count).toBe(3)
  })

  it.each(['surrendered', 'timeout'] as const)('corta la racha al %s', (outcome) => {
    expect(afterRace(win(3), outcome).count).toBe(0)
  })

  it('recuerda cuánto valía la racha que cortó', () => {
    expect(afterRace(win(3), 'timeout').brokenAt).toBe(3)
  })

  it('no reporta corte si no había racha', () => {
    expect(afterRace(NO_STREAK, 'timeout').brokenAt).toBeNull()
  })

  it('vuelve a arrancar de cero después de perder', () => {
    expect(afterRace(afterRace(win(3), 'timeout'), 'won')).toEqual({ count: 1, brokenAt: null })
  })
})
