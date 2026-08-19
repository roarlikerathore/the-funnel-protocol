import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { applyTheme } from './theme'
import { funnel } from './funnel.config'
import './index.css'

// Before first paint, so the page never flashes the fallback palette.
applyTheme()

document.title = `${funnel.event.name} — ${funnel.brand.name}`
document.querySelector('meta[name="description"]')
  ?.setAttribute('content', funnel.promise.subheadline)

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
)
