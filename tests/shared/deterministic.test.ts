import { describe, expect, it } from 'vitest'
import { fractionOf, hash32, pickStable, sampleStable } from '../../src/shared/deterministic'

const id = (t: string) => t
const LISTA = ['Argentina', 'Brasil', 'Chile', 'Dinamarca', 'Egipto', 'Francia', 'Grecia']

describe('hash32', () => {
  it('da siempre el mismo número para el mismo texto', () => {
    expect(hash32('Tango')).toBe(hash32('Tango'))
  })

  it('distingue textos parecidos', () => {
    expect(hash32('Tango')).not.toBe(hash32('Tanga'))
  })
})

describe('fractionOf', () => {
  it('siempre cae dentro de [0, 1)', () => {
    const fuera = Array.from({ length: 500 }, (_, i) => fractionOf(`x${i}`)).filter(
      (f) => f < 0 || f >= 1,
    )
    expect(fuera).toEqual([])
  })
})

describe('pickStable', () => {
  it('elige lo mismo con la misma sal', () => {
    expect(pickStable(LISTA, 'dia', id)).toBe(pickStable(LISTA, 'dia', id))
  })

  it('elige distinto con sales distintas', () => {
    const elegidos = new Set(['a', 'b', 'c', 'd', 'e'].map((s) => pickStable(LISTA, s, id)))
    expect(elegidos.size).toBeGreaterThan(1)
  })

  // Esta es la propiedad que hace posible el desafío diario. Wikipedia se edita
  // durante el día: si eligiéramos por posición, un enlace agregado correría la
  // lista y dos jugadores tendrían carreras distintas.
  it('no cambia de elegido porque se agreguen otros elementos', () => {
    const elegido = pickStable(LISTA, 'dia', id)
    const conAgregados = ['Angola', 'Bolivia', 'Zimbabue', ...LISTA, 'Nepal']
    expect(pickStable(conAgregados, 'dia', id)).toBe(elegido)
  })

  it('no cambia de elegido porque se quiten otros elementos', () => {
    const elegido = pickStable(LISTA, 'dia', id)
    const sinOtros = LISTA.filter((t) => t === elegido || t === 'Chile')
    expect(pickStable(sinOtros, 'dia', id)).toBe(elegido)
  })

  it('devuelve undefined si no hay nada para elegir', () => {
    expect(pickStable([], 'dia', id)).toBeUndefined()
  })
})

describe('sampleStable', () => {
  it('devuelve la misma muestra con la misma sal', () => {
    expect(sampleStable(LISTA, 'dia', id, 3)).toEqual(sampleStable(LISTA, 'dia', id, 3))
  })

  it('no devuelve más de los que hay', () => {
    expect(sampleStable(LISTA, 'dia', id, 99)).toHaveLength(LISTA.length)
  })

  it('no repite elementos', () => {
    const muestra = sampleStable(LISTA, 'dia', id, 4)
    expect(new Set(muestra).size).toBe(muestra.length)
  })

  it('conserva a los elegidos cuando aparecen elementos nuevos', () => {
    const antes = sampleStable(LISTA, 'dia', id, 3)
    const despues = sampleStable([...LISTA, 'Noruega', 'Perú'], 'dia', id, 3)
    // Un elemento nuevo puede colarse, pero no puede reordenar a los demás.
    expect(despues.filter((t) => antes.includes(t)).length).toBeGreaterThanOrEqual(2)
  })
})
