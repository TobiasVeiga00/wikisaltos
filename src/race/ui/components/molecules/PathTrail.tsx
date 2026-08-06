interface PathTrailProps {
  readonly titles: readonly string[]
}

/** The horizontal breadcrumb in the header. Same arrow as a route: one per jump. */
export function PathTrail({ titles }: PathTrailProps) {
  return (
    <ol className="trail">
      {titles.map((title, index) => (
        <li key={`${title}-${index}`} className="trail__step">
          <span className="trail__title">{title}</span>
        </li>
      ))}
    </ol>
  )
}
