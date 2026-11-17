import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Free hosting puts the AI service to sleep, and calls from the API (inside the same host)
// do not wake it. A request that arrives from outside does, so ping it through the Vercel
// /ai-wake route as soon as the app loads; it is awake by the time anyone clicks Generate.
if (import.meta.env.PROD) {
  void fetch('/ai-wake', { cache: 'no-store' }).catch(() => undefined)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
