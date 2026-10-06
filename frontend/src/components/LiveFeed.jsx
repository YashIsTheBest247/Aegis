import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Radio, ShieldCheck, AlertTriangle, Zap } from 'lucide-react'

const KIND_ICON = {
  message: '✉',
  url: '🔗',
  call: '📞',
  'ai-text': '🤖',
  screenshot: '📷',
  voice: '🎙',
}

function timeAgo(ts) {
  const diff = Math.max(1, Math.floor(Date.now() / 1000 - ts))
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

export default function LiveFeed() {
  const [items, setItems] = useState([])
  const [stats, setStats] = useState({ total_scans: 0, threats_blocked: 0 })

  useEffect(() => {
    const load = async () => {
      try {
        const [f, s] = await Promise.all([
          fetch('/api/feed').then((r) => r.json()),
          fetch('/api/stats').then((r) => r.json()),
        ])
        setItems(f.items || [])
        setStats(s || {})
      } catch { /* ignore */ }
    }
    load()
    const id = setInterval(load, 4000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="live-feed-wrap">
      <div className="live-feed-head">
        <div>
          <div className="live-badge">
            <span className="dot-live" />
            LIVE THREAT FEED
          </div>
          <h3 style={{ marginTop: 10 }}>Scans happening across Aegis right now</h3>
          <p style={{ marginTop: 8, fontSize: '0.95rem' }}>
            Real-time, anonymized view of what Aegis is catching. Updates every 4 seconds.
          </p>
        </div>
        <div className="live-stats">
          <div className="live-stat">
            <div className="live-stat-ico"><Zap size={18} /></div>
            <div>
              <div className="live-stat-num">{stats.total_scans || 0}</div>
              <div className="live-stat-lbl">Total scans</div>
            </div>
          </div>
          <div className="live-stat">
            <div className="live-stat-ico" style={{ background: '#FEE2E2', color: '#B91C1C' }}><AlertTriangle size={18} /></div>
            <div>
              <div className="live-stat-num">{stats.threats_blocked || 0}</div>
              <div className="live-stat-lbl">Threats blocked</div>
            </div>
          </div>
          <div className="live-stat">
            <div className="live-stat-ico" style={{ background: '#DCFCE7', color: '#15803D' }}><ShieldCheck size={18} /></div>
            <div>
              <div className="live-stat-num">{stats.avg_threat_score || 0}</div>
              <div className="live-stat-lbl">Avg score</div>
            </div>
          </div>
        </div>
      </div>

      <div className="live-list">
        <AnimatePresence initial={false}>
          {items.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="live-empty"
            >
              <Radio size={22} /> Waiting for the first scan…
              <div style={{ fontSize: '0.82rem', color: '#999', marginTop: 6 }}>
                Try the scanner above — your scan will show here.
              </div>
            </motion.div>
          )}
          {items.map((it) => (
            <motion.div
              key={`${it.ts}-${it.snippet}`}
              layout
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="live-row"
            >
              <div className="live-kind">{KIND_ICON[it.kind] || '•'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="live-snippet">{it.snippet || '(anonymized)'}</div>
                <div className="live-meta">
                  <span style={{ textTransform: 'capitalize' }}>{it.kind.replace('-', ' ')}</span> · {timeAgo(it.ts)}
                </div>
              </div>
              <span className={`verdict-pill verdict-${it.verdict}`} style={{ fontSize: '0.7rem', padding: '4px 10px' }}>
                {it.verdict?.replace(/_/g, ' ')}
              </span>
              <div className="live-score">{it.score}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
