import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  readonly children: ReactNode
}

interface ErrorBoundaryState {
  readonly error: Error | null
}

/**
 * Without this, any exception thrown while rendering unmounts the whole tree and
 * leaves a blank page with no message and no way back. Most of the article HTML
 * comes from outside the app, so the surface for surprises is wide.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Wikisaltos se rompió al renderizar', error, info.componentStack)
  }

  override render(): ReactNode {
    const { error } = this.state
    if (error === null) return this.props.children

    return (
      <main className="crash">
        <h1 className="crash__title">Se rompió algo</h1>
        <p className="crash__lede">
          La partida no pudo seguir. Podés volver a empezar sin perder nada más que esta carrera.
        </p>
        <pre className="crash__detail">{error.message}</pre>
        <button
          type="button"
          className="btn"
          onClick={() => {
            window.location.reload()
          }}
        >
          Empezar de nuevo
        </button>
      </main>
    )
  }
}
