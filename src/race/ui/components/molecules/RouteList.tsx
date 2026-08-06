interface RouteListProps {
  readonly titles: readonly string[]
  readonly tone?: 'player' | 'best'
  readonly note?: string
}

/**
 * A route read downwards, one article per line, with an arrow marking every
 * jump. Laid out this way the number of jumps is countable by eye instead of
 * being something the interface has to claim in a separate label.
 */
export function RouteList({ titles, tone = 'player', note }: RouteListProps) {
  return (
    <>
      <ol className={['route', `route--${tone}`].join(' ')}>
        {titles.map((title, index) => (
          <li key={`${title}-${index}`} className="route__step">
            {title}
          </li>
        ))}
      </ol>
      {note !== undefined && <p className="route__note">{note}</p>}
    </>
  )
}
