import { describe, expect, it } from 'vitest'
import { dayIdAt, formatDayId } from '../../src/race/domain/DailyChallenge'

const utc = (iso: string) => Date.parse(iso)

describe('dayIdAt', () => {
  it('da el día en formato AAAA-MM-DD', () => {
    expect(dayIdAt(utc('2026-08-06T15:00:00Z'))).toBe('2026-08-06')
  })

  // El día se ancla a la hora argentina, no a la de quien juega: dos personas
  // comparando resultados tienen que estar comparando la misma carrera.
  it('todavía es el día anterior a las 2 de la mañana UTC', () => {
    expect(dayIdAt(utc('2026-08-07T02:00:00Z'))).toBe('2026-08-06')
  })

  it('cambia de día a las 3 de la mañana UTC, medianoche en Argentina', () => {
    expect(dayIdAt(utc('2026-08-07T03:00:00Z'))).toBe('2026-08-07')
  })

  it('no cambia a lo largo del día', () => {
    const mañana = dayIdAt(utc('2026-08-06T12:00:00Z'))
    const noche = dayIdAt(utc('2026-08-07T01:59:00Z'))
    expect(mañana).toBe(noche)
  })
})

describe('formatDayId', () => {
  it('lo escribe como se dice', () => {
    expect(formatDayId('2026-08-06')).toBe('6 de agosto')
  })

  it('no deja el cero adelante', () => {
    expect(formatDayId('2026-01-01')).toBe('1 de enero')
  })

  it('devuelve el original si le dan algo que no entiende', () => {
    expect(formatDayId('no-es-fecha')).toBe('no-es-fecha')
  })
})
