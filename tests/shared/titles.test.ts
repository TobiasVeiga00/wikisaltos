import { describe, expect, it } from 'vitest'
import { normalizeTitle, sameTitle } from '../../src/shared/titles'

describe('normalizeTitle', () => {
  it('decodifica los títulos porcentualmente codificados de los enlaces', () => {
    expect(normalizeTitle('Jap%C3%B3n')).toBe('Japón')
  })

  it('sobrevive a un porcentaje literal, que rompería decodeURIComponent', () => {
    expect(normalizeTitle('100%_puro')).toBe('100% puro')
  })

  it('convierte guiones bajos en espacios y colapsa los repetidos', () => {
    expect(normalizeTitle('  Lionel__Messi  ')).toBe('Lionel Messi')
  })
})

describe('sameTitle', () => {
  it('ignora mayúsculas y guiones bajos', () => {
    expect(sameTitle('la_paz', 'La Paz')).toBe(true)
  })

  it('no confunde palabras que solo difieren en la tilde', () => {
    expect(sameTitle('Peru', 'Perú')).toBe(false)
  })
})
