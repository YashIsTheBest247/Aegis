import React from 'react'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-brand-huge" aria-hidden="true">Aegis</div>
      <div className="footer-grid">
        <div className="footer-brand">
          <h4>Aegis AI is the open-source scam-defense platform<br />that keeps the people you love safe — all in one place.</h4>
          <div style={{ marginTop: 20, fontSize: '0.82rem', color: '#888' }}>
            Built with ❤ for ForgeHacks 2026
          </div>
        </div>
        <div className="footer-col">
          <h5>Product</h5>
          <a href="#scanner">Message Scanner</a>
          <a href="#scanner">URL Checker</a>
          <a href="#scanner">Call Analyzer</a>
          <a href="#scanner">AI-Text Detector</a>
        </div>
        <div className="footer-col">
          <h5>Shields</h5>
          <a href="#features">Phishing</a>
          <a href="#features">Impersonation</a>
          <a href="#features">Deepfake</a>
          <a href="#features">Voice clones</a>
        </div>
        <div className="footer-col">
          <h5>Resources</h5>
          <a href="#library">Scam library</a>
          <a href="#library">Share with family</a>
          <a href="#features">How it works</a>
          <a href="#scanner">Try Aegis</a>
        </div>
      </div>
    </footer>
  )
}
