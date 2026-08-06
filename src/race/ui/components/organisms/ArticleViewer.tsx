import { memo, useEffect, useRef, type KeyboardEvent, type MouseEvent } from 'react'
import type { ArticleContent } from '../../../domain/Article'
import { Spinner } from '../atoms/Spinner'

/** Long enough to notice the rejection, short enough not to be in the way. */
const REJECTION_MS = 500

interface ArticleViewerProps {
  readonly article: ArticleContent
  readonly loading: boolean
  readonly onNavigate: (title: string) => void
}

/**
 * Memoised, and not as a micro-optimisation — without it the game loses clicks.
 *
 * The countdown ticks five times a second, and every tick re-rendered this
 * component, which made React re-apply `dangerouslySetInnerHTML` and rebuild the
 * entire article: measured at ten full rebuilds in two seconds on an idle page.
 * A mouse press and its release landing on opposite sides of one of those
 * rebuilds are, to the browser, two events on two different elements — so no
 * click is ever produced. That is the "sometimes it takes it, sometimes you have
 * to click several times" the game was showing, and why it felt random: it
 * depended on where the click fell inside the 200 ms cycle.
 *
 * The props must stay stable for this to hold. `onNavigate` is memoised by the
 * container for exactly that reason.
 */
export const ArticleViewer = memo(function ArticleViewer({
  article,
  loading,
  onNavigate,
}: ArticleViewerProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const pendingRef = useRef<Element | null>(null)

  // Depends on the article object, not its title: clicking a link back to the
  // article you are already on is still a move, and should still start at the top.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [article])

  // Clears the pending mark whether the jump succeeded or failed. On success the
  // element is gone with the old article anyway; on failure it must not stay lit.
  useEffect(() => {
    if (loading) return
    pendingRef.current?.classList.remove('wr-link--pending')
    pendingRef.current = null
  }, [loading])

  /**
   * Feedback goes on the link that was clicked, not only on the bar at the top
   * of the page. A jump takes the better part of a second, and during it the
   * player is looking at the word they just clicked — a spinner four hundred
   * pixels away reads as nothing having happened.
   */
  const activate = (anchor: Element | null) => {
    if (anchor === null) return

    const title = anchor.getAttribute('data-wr-title')
    if (title !== null) {
      // No guard on `loading` here: a click during a jump used to vanish without
      // a trace. The newest one simply takes over.
      pendingRef.current?.classList.remove('wr-link--pending')
      anchor.classList.add('wr-link--pending')
      pendingRef.current = anchor
      onNavigate(title)
      return
    }

    const anchorId = anchor.getAttribute('data-wr-anchor')
    if (anchorId) {
      const destination = contentRef.current?.querySelector(`#${CSS.escape(anchorId)}`)
      destination?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }

    // A dead link leads somewhere the game cannot go: another wiki, a category,
    // an article that does not exist. Silence would leave the player wondering
    // whether they missed the click or the game is broken.
    anchor.classList.add('wr-dead--rejected')
    window.setTimeout(() => {
      anchor.classList.remove('wr-dead--rejected')
    }, REJECTION_MS)
  }

  // One delegated listener beats attaching handlers to a few hundred anchors.
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const anchor = (event.target as HTMLElement).closest('a')
    if (anchor === null) return
    event.preventDefault()
    activate(anchor)
  }

  // The anchors have no href, so the browser will not activate them on Enter by
  // itself. Without this the game cannot be played without a mouse.
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    const anchor = (event.target as HTMLElement).closest('a')
    if (anchor === null) return
    event.preventDefault()
    activate(anchor)
  }

  return (
    <div className="viewer" ref={scrollRef}>
      {loading && (
        <div className="viewer__overlay">
          <Spinner label="Cargando artículo…" />
        </div>
      )}
      <article className={['paper', loading && 'paper--loading'].filter(Boolean).join(' ')}>
        <h1 className="paper__title">{article.title}</h1>
        <div
          ref={contentRef}
          className="paper__body"
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          dangerouslySetInnerHTML={{ __html: article.html }}
        />
      </article>
    </div>
  )
})
