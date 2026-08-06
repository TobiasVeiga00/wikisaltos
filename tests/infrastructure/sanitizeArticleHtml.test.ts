/**
 * @vitest-environment jsdom
 *
 * Esta función es la única frontera entre el jugador y HTML de terceros: su
 * resultado va directo a dangerouslySetInnerHTML y React no lo vuelve a revisar.
 */
import { describe, expect, it } from 'vitest'
import { sanitizeArticleHtml } from '../../src/race/infrastructure/wikipedia/sanitizeArticleHtml'

const parse = (html: string) => {
  const doc = new DOMParser().parseFromString(sanitizeArticleHtml(html), 'text/html')
  return doc.body
}

describe('elementos peligrosos', () => {
  it.each([
    ['script', '<script>window.robado = 1</script>'],
    ['iframe', '<iframe src="https://malo.example"></iframe>'],
    ['object', '<object data="x.swf"></object>'],
    ['embed', '<embed src="x.swf">'],
    ['form', '<form action="https://malo.example"><input name="a"></form>'],
    ['base', '<base href="https://malo.example">'],
    ['style', '<style>body{display:none}</style>'],
    ['video', '<video src="x.mp4"></video>'],
  ])('elimina %s por completo', (tag, html) => {
    expect(parse(`<p>texto</p>${html}`).querySelector(tag)).toBeNull()
  })

  it('elimina también el contenido de un elemento descartado', () => {
    expect(parse('<form><p>adentro</p></form>').textContent).not.toContain('adentro')
  })

  it('quita los manejadores de eventos en línea', () => {
    const img = parse('<img src="//upload.wikimedia.org/a.png" onerror="window.robado=1">')
    expect(img.querySelector('img')?.getAttribute('onerror')).toBeNull()
  })
})

describe('etiquetas desconocidas', () => {
  // El caso que justifica la lista blanca: una etiqueta que Wikipedia agregue
  // mañana no se inyecta tal cual, se degrada a su texto.
  it('conserva el texto pero descarta la etiqueta', () => {
    const body = parse('<wiki-widget><p>hola</p></wiki-widget>')
    expect(body.innerHTML).not.toContain('wiki-widget')
    expect(body.textContent).toContain('hola')
  })

  it('rescata los enlaces que estaban adentro', () => {
    const body = parse('<custom-el><a href="/wiki/Tango">tango</a></custom-el>')
    expect(body.querySelector('[data-wr-title="Tango"]')).not.toBeNull()
  })
})

describe('atributos', () => {
  it('descarta los que no están permitidos', () => {
    const el = parse('<p data-rastreo="1" formaction="x">a</p>').querySelector('p')
    expect(el?.getAttribute('data-rastreo')).toBeNull()
  })

  it('conserva los de maquetación que Wikipedia necesita', () => {
    const el = parse(
      '<table><tr><td colspan="2" class="infobox">a</td></tr></table>',
    ).querySelector('td')
    expect(el?.getAttribute('colspan')).toBe('2')
    expect(el?.getAttribute('class')).toBe('infobox')
  })

  it('conserva un style inofensivo', () => {
    const el = parse('<div style="float:right">a</div>').querySelector('div')
    expect(el?.getAttribute('style')).toBe('float:right')
  })

  it.each([
    'background:url(https://rastreador.example/x.png)',
    '@import "x.css"',
    'width:expression(alert(1))',
  ])('descarta el style que puede salir a la red: %s', (style) => {
    const el = parse(`<div style="${style}">a</div>`).querySelector('div')
    expect(el?.getAttribute('style')).toBeNull()
  })

  it.each([
    'javascript:alert(1)',
    'data:text/html;base64,PHN2Zz4=',
    'http://inseguro.example/x.png',
  ])('descarta un src que no sea de Wikimedia: %s', (src) => {
    const el = parse(`<img src="${src}">`).querySelector('img')
    expect(el?.getAttribute('src')).toBeNull()
  })

  it('conserva las imágenes de Wikimedia', () => {
    const el = parse('<img src="//upload.wikimedia.org/a.png">').querySelector('img')
    expect(el?.getAttribute('src')).toBe('//upload.wikimedia.org/a.png')
  })
})

describe('enlaces', () => {
  it('marca los artículos jugables con su título', () => {
    const a = parse('<a href="/wiki/Lionel_Messi">Messi</a>').querySelector('a')
    expect(a?.getAttribute('data-wr-title')).toBe('Lionel Messi')
    expect(a?.getAttribute('href')).toBeNull()
  })

  it('decodifica los títulos con acentos', () => {
    const a = parse('<a href="/wiki/Jap%C3%B3n">Japón</a>').querySelector('a')
    expect(a?.getAttribute('data-wr-title')).toBe('Japón')
  })

  it('deja jugable el enlace aunque apunte a una sección', () => {
    const a = parse('<a href="/wiki/Tango#Historia">tango</a>').querySelector('a')
    expect(a?.getAttribute('data-wr-title')).toBe('Tango')
  })

  it.each([
    ['una categoría', '/wiki/Categoría:Música'],
    ['un archivo', '/wiki/Archivo:Foo.jpg'],
    ['una plantilla', '/wiki/Plantilla:Ficha'],
    ['un sitio externo', 'https://otro.example'],
  ])('no deja jugable %s', (_caso, href) => {
    const a = parse(`<a href="${href}">x</a>`).querySelector('a')
    expect(a?.getAttribute('data-wr-title')).toBeNull()
    expect(a?.classList.contains('wr-dead')).toBe(true)
  })

  it('no deja jugable un enlace rojo, porque el artículo no existe', () => {
    const a = parse('<a href="/wiki/Inexistente" class="new">x</a>').querySelector('a')
    expect(a?.getAttribute('data-wr-title')).toBeNull()
  })

  it('marca las anclas internas', () => {
    const a = parse('<a href="#Historia">ir</a>').querySelector('a')
    expect(a?.getAttribute('data-wr-anchor')).toBe('Historia')
  })

  // querySelector('#') lanza excepción en vez de devolver null: un href vacío
  // llegaba al visor y le tiraba la partida abajo al jugador.
  it('no marca como ancla un href vacío', () => {
    const a = parse('<a href="#">nada</a>').querySelector('a')
    expect(a?.getAttribute('data-wr-anchor')).toBeNull()
  })

  it('devuelve al foco y al lector de pantalla los enlaces jugables', () => {
    const a = parse('<a href="/wiki/Tango">tango</a>').querySelector('a')
    expect(a?.getAttribute('tabindex')).toBe('0')
    expect(a?.getAttribute('role')).toBe('link')
  })

  it('no da foco a los enlaces muertos', () => {
    const a = parse('<a href="https://otro.example">x</a>').querySelector('a')
    expect(a?.getAttribute('tabindex')).toBeNull()
  })
})

describe('limpieza de Wikipedia', () => {
  // La caja "Escucha este artículo" comparte la clase infobox_v2 con el infobox
  // real: flotaban las dos y dejaban el texto en una columna de 180px.
  it('elimina las cajas de mantenimiento sin tocar el infobox real', () => {
    const body = parse(
      '<table class="infobox_v2 noprint"><tr><td>audio</td></tr></table>' +
        '<table class="infobox"><tr><td>datos</td></tr></table>',
    )
    expect(body.querySelectorAll('table')).toHaveLength(1)
    expect(body.textContent).toContain('datos')
  })

  it('conserva los hatnotes, que son divs y llevan enlaces jugables', () => {
    const body = parse('<div class="rellink noprint hatnote"><a href="/wiki/Tango">véase</a></div>')
    expect(body.querySelector('[data-wr-title="Tango"]')).not.toBeNull()
  })
})
