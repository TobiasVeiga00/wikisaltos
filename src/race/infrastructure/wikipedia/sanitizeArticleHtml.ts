import { normalizeTitle } from '../../../shared/titles'

/**
 * Namespaces that are not playable articles. Blocking them is a technical
 * necessity rather than a game rule: `action=parse` on a category or file page
 * returns something the viewer cannot treat as a move.
 */
const BLOCKED_NAMESPACE =
  /^(Especial|Archivo|Ayuda|Wikipedia|Wikiproyecto|Categoría|Portal|Plantilla|Usuario|Discusión|Módulo|MediaWiki|Anexo|Special|File|Help|Template|Category|Talk|User|Module)\s*:/i

/**
 * Elements dropped along with everything inside them. A whitelist already covers
 * the security case, but naming these keeps the intent explicit: nothing here
 * has content worth salvaging, and unwrapping them would leak their innards
 * into the article.
 */
const DISCARDED_TAGS = new Set([
  'applet',
  'audio',
  'base',
  'button',
  'canvas',
  'embed',
  'form',
  'frame',
  'frameset',
  'iframe',
  'input',
  'link',
  'math',
  'meta',
  'noscript',
  'object',
  'script',
  'select',
  'style',
  'svg',
  'template',
  'textarea',
  'video',
])

/**
 * Elements allowed to survive. Anything else keeps its text but loses its tag,
 * so a new element in Wikipedia's markup degrades into plain content instead of
 * being injected as-is. That is the whole point of listing what is permitted
 * rather than what is forbidden: the unknown case fails closed.
 */
const ALLOWED_TAGS = new Set([
  'a',
  'abbr',
  'b',
  'big',
  'blockquote',
  'br',
  'caption',
  'cite',
  'code',
  'dd',
  'div',
  'dl',
  'dt',
  'em',
  'figcaption',
  'figure',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'img',
  'li',
  'ol',
  'p',
  'pre',
  'q',
  's',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
])

/**
 * `srcset` is deliberately absent: it holds several URLs separated by commas,
 * so validating it properly means parsing it, and `src` alone renders every
 * image fine.
 *
 * The last four entries are what the link pass writes. `href` is not among them
 * — by the time attributes are filtered, every anchor has already been read and
 * stripped of it.
 */
const ALLOWED_ATTRIBUTES = new Set([
  'alt',
  'class',
  'colspan',
  'dir',
  'height',
  'id',
  'lang',
  'rowspan',
  'span',
  'src',
  'style',
  'title',
  'width',
  'data-wr-title',
  'data-wr-anchor',
  'role',
  'tabindex',
])

/** CSS that can reach the network or execute. Wikipedia's layout needs none of it. */
const UNSAFE_STYLE = /url\s*\(|expression\s*\(|behavio|@import|javascript:/i

/**
 * Wikipedia marks non-content boxes with `noprint`, and the spoken-article
 * player carries the same `infobox_v2` class as a real infobox. Left in, it
 * floats alongside the real one and squeezes the article into a column a few
 * words wide. Hatnotes are divs, so filtering tables by `noprint` spares them.
 */
const CLUTTER_SELECTORS = [
  'table.noprint',
  'table.ambox',
  'table.metadata',
  '.mw-tmh-player',
  '.mediaContainer',
  '.mw-editsection',
  '.mw-jump-link',
  '#catlinks',
  '.printfooter',
  '.navbox-styles',
  '.mw-kartographer-container',
].join(', ')

/**
 * Turns raw `action=parse` HTML into something safe to inject and playable.
 *
 * This function is the only thing standing between the player and third-party
 * HTML: the result goes straight into `dangerouslySetInnerHTML`, and React does
 * not re-check it. Every `href` is removed so the page cannot navigate anywhere,
 * and article links are re-tagged with the title they lead to.
 */
export function sanitizeArticleHtml(rawHtml: string): string {
  const doc = new DOMParser().parseFromString(rawHtml, 'text/html')

  doc.querySelectorAll(CLUTTER_SELECTORS).forEach((node) => {
    node.remove()
  })

  // One walk over the tree, with the link pass folded in. This was tried as a
  // speed fix and is not one: measured on "Argentina" (1.7 MB, 18k elements)
  // the difference sits inside the run-to-run noise, because the cost is in
  // `DOMParser` — 259 ms of the 539 the whole pipeline took — not in the walks.
  // It stays because one traversal is easier to follow than two, and because it
  // puts the ordering rule right where it matters.
  for (const element of Array.from(doc.body.querySelectorAll('*'))) {
    // Unwrapping a parent detaches nothing, but removing one does — skip the
    // descendants of anything already discarded.
    if (!element.isConnected) continue
    const tag = element.tagName.toLowerCase()

    if (DISCARDED_TAGS.has(tag)) {
      element.remove()
      continue
    }
    if (!ALLOWED_TAGS.has(tag)) {
      element.replaceWith(...Array.from(element.childNodes))
      continue
    }
    // Links are read before their attributes are filtered, because filtering
    // removes `href` — the very thing that says where a link leads.
    if (tag === 'a') tagLink(element as HTMLAnchorElement)
    stripAttributes(element)
  }

  return doc.body.innerHTML
}

function stripAttributes(element: Element): void {
  const attributes = element.attributes
  // Backwards and by index: removing shifts the live list, and `Array.from`
  // here would allocate one throwaway array per element.
  for (let i = attributes.length - 1; i >= 0; i -= 1) {
    const attribute = attributes[i]
    if (attribute === undefined) continue
    const name = attribute.name.toLowerCase()

    if (!ALLOWED_ATTRIBUTES.has(name)) {
      element.removeAttribute(attribute.name)
    } else if (name === 'style' && UNSAFE_STYLE.test(attribute.value)) {
      element.removeAttribute(attribute.name)
    } else if (name === 'src' && !isSafeImageUrl(attribute.value)) {
      element.removeAttribute(attribute.name)
    }
  }
}

/** Wikipedia serves media over https or protocol-relative URLs, nothing else. */
function isSafeImageUrl(value: string): boolean {
  const trimmed = value.trim().toLowerCase()
  return trimmed.startsWith('https://') || trimmed.startsWith('//') || trimmed.startsWith('/')
}

/**
 * Anchors lose their `href` so nothing can navigate away, which also takes them
 * out of the tab order and out of the accessibility tree. Playable ones get the
 * role and tab stop back by hand, so the game can be played without a mouse.
 */
function tagLink(anchor: HTMLAnchorElement): void {
  const href = anchor.getAttribute('href') ?? ''
  anchor.removeAttribute('href')
  anchor.removeAttribute('target')
  anchor.removeAttribute('rel')

  // A bare "#" carries no fragment. Tagging it would hand the viewer an empty
  // id, and `querySelector('#')` throws rather than returning nothing.
  if (href.startsWith('#') && href.length > 1) {
    anchor.setAttribute('data-wr-anchor', href.slice(1))
    anchor.classList.add('wr-anchor')
    anchor.setAttribute('tabindex', '0')
    anchor.setAttribute('role', 'button')
    return
  }

  if (href.startsWith('/wiki/')) {
    const [rawTitle = ''] = href.slice('/wiki/'.length).split('#')
    const title = normalizeTitle(rawTitle)
    // A red link points at an article that does not exist yet.
    const isRedLink = anchor.classList.contains('new')
    if (title && !isRedLink && !BLOCKED_NAMESPACE.test(title)) {
      anchor.setAttribute('data-wr-title', title)
      anchor.classList.add('wr-link')
      anchor.setAttribute('tabindex', '0')
      anchor.setAttribute('role', 'link')
      return
    }
  }

  anchor.classList.add('wr-dead')
}
