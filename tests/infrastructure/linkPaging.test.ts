import { describe, expect, it } from 'vitest'
import { sliceToken } from '../../src/race/infrastructure/wikipedia/linkPaging'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const letterOf = (token: string) => token.split('|')[2] ?? ''
const fractions = Array.from({ length: 100 }, (_, i) => i / 100)

describe('sliceToken', () => {
  it('arma el token con el formato pageid|namespace|título que documenta la API', () => {
    const [pageId, namespace] = sliceToken(8739, 'Escuela', 0.5).split('|')
    expect(pageId).toBe('8739')
    expect(namespace).toBe('0')
  })

  // Una letra inválida no rompe el pedido: la API devuelve vacío en silencio y
  // la carrera pierde variedad sin que nada avise.
  it('siempre termina en una única letra del alfabeto', () => {
    const invalidos = ['Escuela', 'zapato', 'Ñoqui', 'Zurich', '29er', '', 'Álvarez'].flatMap(
      (titulo) =>
        fractions
          .map((f) => letterOf(sliceToken(1, titulo, f)))
          .filter((letra) => letra.length !== 1 || !ALPHABET.includes(letra)),
    )
    expect(invalidos).toEqual([])
  })

  it('nunca vuelve atrás de la letra recibida', () => {
    expect(fractions.every((f) => letterOf(sliceToken(1, 'Escuela', f)) >= 'F')).toBe(true)
  })

  it('no se cuelga al final del alfabeto', () => {
    expect(fractions.every((f) => letterOf(sliceToken(1, 'Zurich', f)) === 'Z')).toBe(true)
  })

  // El desafío diario depende de esto: misma fracción, mismo tramo, para todos.
  it('es determinista para una misma fracción', () => {
    expect(sliceToken(8739, 'Escuela', 0.42)).toBe(sliceToken(8739, 'Escuela', 0.42))
  })
})
