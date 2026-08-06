import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/global.css'
import { ErrorBoundary } from './ui/ErrorBoundary'

const container = document.getElementById('root')
if (container === null) throw new Error('No se encontró el nodo #root')

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
