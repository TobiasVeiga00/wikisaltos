import { describe, expect, it } from 'vitest'
import { randomSliceToken } from '../../src/race/infrastructure/wikipedia/linkPaging'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const letterOf = (token: string) => token.split('|')[2] ?? ''
const tokensFor = (lastTitle: string, times = 300) =>
  Array.from({ length: times }, () => randomSliceToken(8739, lastTitle))

describe('randomSliceToken', () => {
  it('arma el token con el formato pageid|namespace|título que documenta la API', () => {
    const [pageId, namespace] = randomSliceToken(8739, 'Escuela').split('|')
    expect(pageId).toBe('8739')
    expect(namespace).toBe('0')
  })

  // Una letra inválida no rompe el pedido: la API devuelve vacío en silencio y
  // la carrera pierde variedad sin que nada avise.
  it('siempre termina en una única letra del alfabeto', () => {
    const invalid = ['Escuela', 'zapato', 'Ñoqui', 'Zurich', '29er', '', 'Álvarez']
      .flatMap((title) => tokensFor(title, 100))
      .filter((token) => {
        const letter = letterOf(token)
        return letter.length !== 1 || !ALPHABET.includes(letter)
      })
    expect(invalid).toEqual([])
  })

  it('nunca vuelve atrás de la letra recibida', () => {
    expect(tokensFor('Escuela').every((token) => letterOf(token) >= 'F')).toBe(true)
  })

  it('no se cuelga al final del alfabeto', () => {
    expect(tokensFor('Zurich', 20).every((token) => letterOf(token) === 'Z')).toBe(true)
  })
})
