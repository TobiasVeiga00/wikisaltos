interface ReadoutProps {
  readonly label: string
  readonly value: string
  readonly warning?: boolean
}

export function Readout({ label, value, warning = false }: ReadoutProps) {
  return (
    <div>
      <span className="label">{label}</span>
      <span
        className={['readout__value', warning && 'readout__value--warning']
          .filter(Boolean)
          .join(' ')}
      >
        {value}
      </span>
    </div>
  )
}
