import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Track click position on .btn elements so the CSS ripple radiates from the tap point.
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest?.('.btn')
    if (!btn) return
    const r = btn.getBoundingClientRect()
    btn.style.setProperty('--rx', `${((e.clientX - r.left) / r.width) * 100}%`)
    btn.style.setProperty('--ry', `${((e.clientY - r.top) / r.height) * 100}%`)
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
