import { describe, expect, it } from 'vitest'
import type { ArticleSummary } from '../../src/race/domain/Article'
import { isDullTarget } from '../../src/race/infrastructure/wikipedia/dullTargets'

const target = (title: string, description: string | null): ArticleSummary => ({
  title,
  description,
  extract: null,
  thumbnailUrl: 'https://example.org/x.jpg',
})

describe('isDullTarget', () => {
  // Los casos aburridos salieron de medir 149 carreras generadas: los únicos
  // destinos que se repitieron eran metadata enlazada desde casi todo infobox.
  it.each([
    ['International Standard Name Identifier', 'identificador de nombres'],
    ['ISO 639-3', 'código de idioma'],
    ['Kilómetro cuadrado', 'unidad de superficie'],
    ['VIAF', 'catálogo de autoridades'],
    ['Anexo:Países del mundo', 'lista'],
    ['ISBN', 'norma internacional'],
  ])('descarta "%s"', (title, description) => {
    expect(isDullTarget(target(title, description))).toBe(true)
  })

  // Estos existen para que el filtro no se lleve puesto medio Wikipedia: varios
  // empiezan igual que los aburridos o comparten palabras con sus descripciones.
  it.each([
    ['Lionel Messi', 'futbolista argentino'],
    ['Empanada', 'tipo de masa rellena'],
    ['Bangladés', 'país de Asia del Sur'],
    ['Idioma inglés', 'lengua germánica occidental'],
    ['Isómero', 'compuesto con la misma fórmula molecular'],
    ['Isótopo', null],
    ['Isla de Pascua', 'isla de Chile'],
  ])('conserva "%s"', (title, description) => {
    expect(isDullTarget(target(title, description))).toBe(false)
  })
})
