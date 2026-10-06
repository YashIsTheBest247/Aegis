import React from 'react'
import { Shield } from 'lucide-react'

export default function CTA() {
  return (
    <div className="cta-card">
      <div className="glow" />
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20, background: 'rgba(255,90,31,0.15)',
          color: '#FF5A1F', display: 'grid', placeItems: 'center', margin: '0 auto 24px',
          border: '1px solid rgba(255,90,31,0.3)'
        }}>
          <Shield size={32} />
        </div>
        <h2>One AI shield, every scam.<br />Share with the people you love.</h2>
        <p>
          Aegis AI is open source and free. Install it, send it to your parents, deploy it in your company —
          and stop the next AI scam before it starts.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#scanner" className="btn btn-primary btn-lg">Scan Now — Free</a>
        </div>
      </div>
    </div>
  )
}
