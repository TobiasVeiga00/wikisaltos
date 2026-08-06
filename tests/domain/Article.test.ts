import { describe, expect, it } from 'vitest'
import { summaryLine, type ArticleSummary } from '../../src/race/domain/Article'

const summary = (fields: Partial<ArticleSummary>): ArticleSummary => ({
  title: 'X',
  description: null,
  extract: null,
  thumbnailUrl: null,
  ...fields,
})

describe('summaryLine', () => {
  it('prefiere la descripción corta de Wikipedia', () => {
    const line = summaryLine(summary({ description: 'ciudad de Bolivia', extract: 'Otra cosa.' }))
    expect(line).toBe('ciudad de Bolivia')
  })

  it('sin descripción usa la primera frase del extracto', () => {
    expect(summaryLine(summary({ extract: 'Es una ciudad. Fundada en 1548.' }))).toBe(
      'Es una ciudad.',
    )
  })

  it('devuelve entero un extracto de una sola frase', () => {
    expect(summaryLine(summary({ extract: 'Es una ciudad.' }))).toBe('Es una ciudad.')
  })

  it('recorta una primera frase larguísima', () => {
    const line = summaryLine(summary({ extract: `${'a'.repeat(400)}. Segunda.` }))
    expect(line?.endsWith('…')).toBe(true)
    expect(line?.length).toBeLessThanOrEqual(151)
  })

  it('devuelve null cuando no hay nada que decir', () => {
    expect(summaryLine(summary({}))).toBeNull()
  })
})
