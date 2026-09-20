import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './ui-polish.css'

// A browser refresh starts a fresh visit at the chest, while in-app navigation keeps working.
const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
if (navigation?.type === 'reload') {
  const home = import.meta.env.BASE_URL
  if (window.location.pathname !== home || window.location.search || window.location.hash) {
    window.history.replaceState(window.history.state, '', home)
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
