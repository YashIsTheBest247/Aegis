import React from 'react'

const STATS = [
  { num: '$4.6T', label: 'Lost to scams globally in 2026' },
  { num: '3000%', label: 'YoY growth in deepfake fraud' },
  { num: '46%', label: 'Humans catch AI phishing — Aegis catches 94%' },
  { num: '<2s', label: 'Average Gemini threat verdict' },
]

export default function StatsStrip() {
  return (
    <div className="stats-strip">
      {STATS.map((s) => (
        <div key={s.label}>
          <div className="stat-num">{s.num}</div>
          <div className="stat-label">{s.label}</div>
        </div>
      ))}
    </div>
  )
}
