const WARNING_THRESHOLD_MS = 30_000

interface TimeBarProps {
  readonly remainingMs: number
  readonly limitMs: number
}

/** The clock as a hairline across the top of the screen: read without looking. */
export function TimeBar({ remainingMs, limitMs }: TimeBarProps) {
  const ratio = limitMs === 0 ? 0 : remainingMs / limitMs
  const warning = remainingMs <= WARNING_THRESHOLD_MS

  return (
    <div
      className={['timebar', warning && 'timebar--warning'].filter(Boolean).join(' ')}
      aria-hidden="true"
    >
      <span className="timebar__fill" style={{ transform: `scaleX(${ratio})` }} />
    </div>
  )
}
