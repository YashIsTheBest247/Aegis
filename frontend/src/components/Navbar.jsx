import React from 'react'
import { Shield } from 'lucide-react'

export default function Navbar() {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <a className="nav-logo" href="#">
          <span className="nav-logo-mark"><Shield size={16} /></span>
          Aegis AI
        </a>
        <div className="nav-links">
          <a href="#features">Shields</a>
          <a href="#scanner">Scan</a>
          <a href="#usecases">Use cases</a>
          <a href="#integrate">API</a>
          <a href="#library">Library</a>
        </div>
        <div className="nav-cta">
          <a className="btn btn-dark" href="#scanner">Try Aegis</a>
        </div>
      </div>
    </nav>
  )
}
