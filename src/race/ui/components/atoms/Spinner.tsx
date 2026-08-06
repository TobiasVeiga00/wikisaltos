interface SpinnerProps {
  readonly label?: string
}

export function Spinner({ label }: SpinnerProps) {
  return (
    <div className="spinner" role="status" aria-live="polite">
      <span className="spinner__ring" aria-hidden="true" />
      {label !== undefined && <span className="spinner__label">{label}</span>}
    </div>
  )
}
