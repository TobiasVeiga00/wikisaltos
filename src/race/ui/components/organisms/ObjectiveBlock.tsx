import { summaryLine, type ArticleSummary } from '../../../domain/Article'

interface ObjectiveBlockProps {
  readonly target: ArticleSummary
}

/**
 * The target, at a size nothing else on screen competes with, plus one line
 * saying what it is. Without that line a target like "Walberto Caicedo" tells
 * the player nothing at all.
 */
export function ObjectiveBlock({ target }: ObjectiveBlockProps) {
  const context = summaryLine(target)

  return (
    <div className="objective">
      {target.thumbnailUrl !== null && (
        <img className="objective__thumb" src={target.thumbnailUrl} alt="" width={52} height={52} />
      )}

      <div className="objective__text">
        <span className="label">Llegar a</span>
        <h1 className="objective__title">{target.title}</h1>
        {context !== null && <p className="objective__description">{context}</p>}
      </div>
    </div>
  )
}
