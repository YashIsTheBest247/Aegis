import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, PieChart as PieIcon, BarChart3, Activity } from 'lucide-react'

const KIND_COLORS = {
  message:    '#FF5A1F',
  url:        '#8B5CF6',
  call:       '#0284C7',
  'ai-text':  '#15803D',
  screenshot: '#DC2626',
  voice:      '#B45309',
}
const VERDICT_COLORS = {
  SAFE: '#22C55E',
  SUSPICIOUS: '#F59E0B',
  LIKELY_SCAM: '#F97316',
  LIKELY_PHISHING: '#F97316',
  LIKELY_AI: '#F97316',
  MIXED: '#F59E0B',
  DANGEROUS: '#EF4444',
  AI_GENERATED: '#EF4444',
  HUMAN: '#22C55E',
  LIKELY_HUMAN: '#22C55E',
  UNKNOWN: '#9CA3AF',
}

export default function TrendsDashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch('/api/trends')
        if (r.ok) setData(await r.json())
      } catch { /* ignore */ }
    }
    load()
    const id = setInterval(load, 6000)
    return () => clearInterval(id)
  }, [])

  const verdicts = data?.verdicts || {}
  const kinds = data?.kinds || {}
  const scores = data?.score_buckets || [0,0,0,0,0]
  const trend = data?.trend_24h || Array(12).fill(0)

  const totalV = Object.values(verdicts).reduce((a,b) => a+b, 0) || 1

  return (
    <div className="trends-grid">
      <div className="trend-card trend-span">
        <div className="trend-head">
          <div className="trend-ico" style={{ background: '#FFE4D6', color: '#FF5A1F' }}><Activity size={18} /></div>
          <div>
            <div className="trend-title">Threat volume · last 24 hours</div>
            <div className="trend-sub">Scans per 2-hour window</div>
          </div>
        </div>
        <LineChart data={trend} />
      </div>

      <div className="trend-card">
        <div className="trend-head">
          <div className="trend-ico" style={{ background: '#EDE4FF', color: '#8B5CF6' }}><PieIcon size={18} /></div>
          <div>
            <div className="trend-title">Verdict breakdown</div>
            <div className="trend-sub">{totalV} total scans</div>
          </div>
        </div>
        <DonutChart segments={Object.entries(verdicts).map(([k, v]) => ({ label: k, value: v, color: VERDICT_COLORS[k] || '#9CA3AF' }))} />
      </div>

      <div className="trend-card">
        <div className="trend-head">
          <div className="trend-ico" style={{ background: '#D6F0FA', color: '#0284C7' }}><BarChart3 size={18} /></div>
          <div>
            <div className="trend-title">Threat score distribution</div>
            <div className="trend-sub">0 to 100 scale</div>
          </div>
        </div>
        <BarChart data={scores} labels={['0–20','21–40','41–60','61–80','81–100']} />
      </div>

      <div className="trend-card">
        <div className="trend-head">
          <div className="trend-ico" style={{ background: '#DCFCE7', color: '#15803D' }}><TrendingUp size={18} /></div>
          <div>
            <div className="trend-title">By channel</div>
            <div className="trend-sub">Where scams come in</div>
          </div>
        </div>
        <ChannelBreakdown kinds={kinds} />
      </div>
    </div>
  )
}

function LineChart({ data }) {
  const max = Math.max(1, ...data)
  const w = 520, h = 140, p = 8
  const step = (w - p * 2) / (data.length - 1)
  const pts = data.map((v, i) => [p + i * step, h - p - (v / max) * (h - p * 2)])
  const d = pts.reduce((acc, [x,y], i) => acc + (i === 0 ? `M${x},${y}` : ` L${x},${y}`), '')
  const area = d + ` L${pts[pts.length-1][0]},${h-p} L${pts[0][0]},${h-p} Z`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="trend-svg" preserveAspectRatio="none">
      <defs>
        <linearGradient id="lg1" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#FF5A1F" stopOpacity="0.3" />
          <stop offset="1" stopColor="#FF5A1F" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path d={area} fill="url(#lg1)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
      <motion.path d={d} fill="none" stroke="#FF5A1F" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }} />
      {pts.map(([x,y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="#FF5A1F" />
      ))}
    </svg>
  )
}

function DonutChart({ segments }) {
  const total = segments.reduce((a, s) => a + s.value, 0)
  const r = 50, cx = 70, cy = 70, c = 2 * Math.PI * r
  let acc = 0
  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
      <svg viewBox="0 0 140 140" width="140" height="140" style={{ flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ECECEC" strokeWidth="18" />
        {total > 0 && segments.map((s, i) => {
          const frac = s.value / total
          const dash = frac * c
          const circle = (
            <motion.circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="18"
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-acc}
              transform={`rotate(-90 ${cx} ${cy})`}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: i * 0.1 }}
            />
          )
          acc += dash
          return circle
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="18" fontWeight="800" fill="#111" fontFamily="Space Grotesk">{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9" fill="#888" fontWeight="600">SCANS</text>
      </svg>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 120 }}>
        {segments.length === 0 && <div style={{ fontSize: '0.85rem', color: '#999' }}>No scans yet.</div>}
        {segments.map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} />
            <span style={{ color: '#333', fontWeight: 600, flex: 1 }}>{s.label.replace(/_/g, ' ')}</span>
            <span style={{ color: '#999' }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BarChart({ data, labels }) {
  const max = Math.max(1, ...data)
  const colors = ['#22C55E', '#A3E635', '#F59E0B', '#F97316', '#EF4444']
  return (
    <div className="bars-wrap">
      {data.map((v, i) => (
        <div key={i} className="bar-col">
          <div className="bar-track">
            <motion.div
              className="bar-fill"
              style={{ background: colors[i] }}
              initial={{ height: 0 }}
              animate={{ height: `${(v / max) * 100}%` }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: 'easeOut' }}
            />
          </div>
          <div className="bar-label">{labels[i]}</div>
          <div className="bar-value">{v}</div>
        </div>
      ))}
    </div>
  )
}

function ChannelBreakdown({ kinds }) {
  const entries = Object.entries(kinds).sort((a, b) => b[1] - a[1])
  const total = entries.reduce((a, [,v]) => a + v, 0)
  if (!total) return <div style={{ fontSize: '0.85rem', color: '#999' }}>No scans yet.</div>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {entries.map(([k, v]) => (
        <div key={k}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#333', textTransform: 'capitalize' }}>{k.replace('-', ' ')}</span>
            <span style={{ fontSize: '0.8rem', color: '#888' }}>{v}</span>
          </div>
          <div style={{ height: 8, background: '#ECECEC', borderRadius: 999 }}>
            <motion.div
              style={{ height: '100%', borderRadius: 999, background: KIND_COLORS[k] || '#999' }}
              initial={{ width: 0 }}
              animate={{ width: `${(v / total) * 100}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
