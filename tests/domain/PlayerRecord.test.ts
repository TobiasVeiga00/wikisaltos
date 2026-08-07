import { describe, expect, it } from 'vitest'
import type { ArticleSummary } from '../../src/race/domain/Article'
import {
  dailyResultFor,
  hasPlayedDaily,
  NEW_PLAYER,
  recordRace,
  type PlayerRecord,
} from '../../src/race/domain/PlayerRecord'
import { createRace, finish, visit, type Race } from '../../src/race/domain/Race'

const PIZZA: ArticleSummary = {
  title: 'Pizza',
  description: null,
  extract: null,
  thumbnailUrl: null,
}

const T0 = 1_000_000
const nueva = (dayId: string | null = null): Race =>
  createRace({ title: 'Maradona' }, PIZZA, ['Maradona', 'Italia', 'Pizza'], 300_000, T0, dayId)

const ganada = (dayId: string | null = null) => visit(nueva(dayId), 'Pizza', T0 + 30_000)
const perdida = (dayId: string | null = null) => finish(nueva(dayId), 'timeout', T0 + 300_000)

const trasVarias = (...carreras: Race[]): PlayerRecord =>
  carreras.reduce((r, c) => recordRace(r, c, 2), NEW_PLAYER)

describe('recordRace', () => {
  it('ignora una carrera que todavía no terminó', () => {
    expect(recordRace(NEW_PLAYER, nueva(), 2)).toBe(NEW_PLAYER)
  })

  it('cuenta jugadas y ganadas', () => {
    const r = trasVarias(ganada(), perdida(), ganada())
    expect(r.played).toBe(3)
    expect(r.won).toBe(2)
  })

  it('encadena la racha y recuerda la mejor', () => {
    const r = trasVarias(ganada(), ganada(), ganada(), perdida())
    expect(r.streak).toBe(0)
    expect(r.bestStreak).toBe(3)
  })

  it('la mejor racha no baja aunque la actual se corte', () => {
    const r = trasVarias(ganada(), ganada(), perdida(), ganada())
    expect(r.streak).toBe(1)
    expect(r.bestStreak).toBe(2)
  })
})

describe('el desafío del día', () => {
  it('queda registrado al terminarlo', () => {
    const r = recordRace(NEW_PLAYER, ganada('2026-08-07'), 2)
    expect(hasPlayedDaily(r, '2026-08-07')).toBe(true)
    expect(dailyResultFor(r, '2026-08-07')?.outcome).toBe('won')
  })

  it('no se registra si la carrera era al azar', () => {
    expect(recordRace(NEW_PLAYER, ganada(null), 2).daily).toBeNull()
  })

  // Un solo intento por día: si una segunda vuelta pudiera pisar el resultado,
  // el primero no significaría nada.
  it('el primer intento no se pisa con un segundo', () => {
    const primero = recordRace(NEW_PLAYER, perdida('2026-08-07'), 2)
    const segundo = recordRace(primero, ganada('2026-08-07'), 2)
    expect(segundo.daily?.outcome).toBe('timeout')
  })

  it('un día nuevo sí reemplaza al anterior', () => {
    const ayer = recordRace(NEW_PLAYER, ganada('2026-08-06'), 2)
    const hoy = recordRace(ayer, perdida('2026-08-07'), 3)
    expect(hoy.daily?.dayId).toBe('2026-08-07')
    expect(hasPlayedDaily(hoy, '2026-08-06')).toBe(false)
  })

  it('las carreras al azar siguen sumando a las estadísticas', () => {
    const r = trasVarias(ganada('2026-08-07'), ganada(null))
    expect(r.played).toBe(2)
    expect(r.daily?.dayId).toBe('2026-08-07')
  })
})
