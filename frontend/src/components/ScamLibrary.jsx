import React, { useEffect, useState } from 'react'
import { AlertTriangle, ShieldAlert } from 'lucide-react'

export default function ScamLibrary() {
  const [scams, setScams] = useState([])
  const [open, setOpen] = useState(null)

  useEffect(() => {
    fetch('/api/scam-library')
      .then((r) => r.json())
      .then((d) => setScams(d.scams || []))
      .catch(() => setScams([]))
  }, [])

  if (!scams.length) {
    return <div style={{ textAlign: 'center', color: '#888' }}>Loading library…</div>
  }

  return (
    <>
      <div className="lib-grid">
        {scams.map((s) => (
          <div key={s.id} className="lib-card" onClick={() => setOpen(s)}>
            <span className="cat">{s.category}</span>
            <h3>{s.name}</h3>
            <p style={{ fontSize: '0.92rem' }}>{s.description}</p>
            <div className="ex">"{s.example}"</div>
            <div className="severity" style={{ color: severityColor(s.severity) }}>
              {s.severity === 'critical' ? <ShieldAlert size={16} /> : <AlertTriangle size={16} />}
              {s.severity.toUpperCase()} severity
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div
          onClick={() => setOpen(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'grid', placeItems: 'center', zIndex: 100, padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 24, padding: 32, maxWidth: 560, width: '100%',
              maxHeight: '85vh', overflow: 'auto',
            }}
          >
            <span className="cat">{open.category}</span>
            <h2 style={{ fontSize: '1.8rem', margin: '8px 0 12px' }}>{open.name}</h2>
            <p style={{ marginBottom: 20 }}>{open.description}</p>

            <div className="result-section-title">Red flags</div>
            <ul style={{ paddingLeft: 20, marginBottom: 20, marginTop: 10 }}>
              {open.indicators.map((i, idx) => <li key={idx} style={{ marginBottom: 6 }}>{i}</li>)}
            </ul>

            <div className="result-section-title">Example</div>
            <div className="ex" style={{ marginTop: 10, marginBottom: 20 }}>"{open.example}"</div>

            <div className="result-section-title">What to do</div>
            <ul style={{ paddingLeft: 20, marginTop: 10 }}>
              {open.actions.map((a, idx) => <li key={idx} style={{ marginBottom: 6 }}>{a}</li>)}
            </ul>

            <button className="btn btn-dark" style={{ marginTop: 24 }} onClick={() => setOpen(null)}>Close</button>
          </div>
        </div>
      )}
    </>
  )
}

function severityColor(s) {
  if (s === 'critical') return '#B91C1C'
  if (s === 'high') return '#C2410C'
  if (s === 'medium') return '#B45309'
  return '#15803D'
}
