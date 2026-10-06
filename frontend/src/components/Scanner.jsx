import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Link2, Phone, Bot, Sparkles, Shield, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react'

const TABS = [
  { id: 'message', label: 'Message / Email', icon: MessageSquare, placeholder: 'Paste a suspicious SMS, email, DM, or chat message here…', endpoint: '/api/analyze/message', field: 'message' },
  { id: 'url', label: 'URL / Link', icon: Link2, placeholder: 'https://example.com', endpoint: '/api/analyze/url', field: 'url' },
  { id: 'call', label: 'Call Transcript', icon: Phone, placeholder: 'Paste a transcript of a suspicious call or voicemail…', endpoint: '/api/analyze/call', field: 'transcript' },
  { id: 'ai', label: 'AI-Text Detector', icon: Bot, placeholder: 'Paste any text to detect if it was AI-generated…', endpoint: '/api/analyze/deepfake-text', field: 'text' },
]

const SAMPLES = {
  message: [
    'URGENT: Your Chase account is locked due to unusual activity. Click http://chase-verify-login.co to restore access within 24 hours or lose it permanently.',
    'Hi grandma it\'s me Alex. I was in a car crash and in jail. Please don\'t tell mom. Can you wire $3000 to this account for my bail?',
    'Hey, this is the CEO. I\'m in a board meeting — need you to wire $85,000 to this vendor right now. Keep this confidential.',
  ],
  url: [
    'http://paypa1-security-verify.xyz/login',
    'https://amaz0n-account.top/signin',
    'https://google.com',
  ],
  call: [
    'This is Officer Davis from the IRS. You owe $4,872 in back taxes. If you don\'t pay with Apple gift cards in the next hour, we\'ll issue a warrant for your arrest.',
    'Hi, this is Microsoft Support. We detected a serious virus on your computer. Please download AnyDesk so I can help you remove it right away.',
  ],
  ai: [
    'Dear valued customer, we are reaching out to inform you of an exciting opportunity to enhance your financial future through our comprehensive investment platform.',
    'yo bro just saw ur insta story that spot looks sick lol we should go next weekend',
  ],
}

function ScoreRing({ score, verdict }) {
  const color = (verdict || '').includes('DANGEROUS') ? '#EF4444'
    : (verdict || '').includes('LIKELY') ? '#F97316'
    : (verdict || '').includes('SUSPICIOUS') || (verdict || '').includes('MIXED') ? '#F59E0B'
    : '#22C55E'
  return (
    <div className="score-ring" style={{ '--p': score, background: `conic-gradient(${color} ${score}%, #ECECEC 0)` }}>
      <div className="n">{score}<small>/100</small></div>
    </div>
  )
}

export default function Scanner() {
  const [tab, setTab] = useState('message')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const activeTab = TABS.find((t) => t.id === tab)

  const run = async () => {
    if (!input.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(activeTab.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [activeTab.field]: input }),
      })
      if (!res.ok) throw new Error('Server error')
      const data = await res.json()
      setResult(data)
    } catch (e) {
      setError('Could not reach Aegis backend. Is the FastAPI server running on port 8010?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="tool-wrap">
      <div className="tool-tabs">
        {TABS.map((t) => {
          const I = t.icon
          return (
            <button
              key={t.id}
              className={`tool-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => { setTab(t.id); setResult(null); setInput('') }}
            >
              <I size={16} />
              {t.label}
            </button>
          )
        })}
      </div>

      <div className="tool-grid">
        <div className="tool-input-wrap">
          <div className="tool-label">
            <Sparkles size={16} color="#FF5A1F" />
            Input
          </div>
          {tab === 'url' ? (
            <input
              className="tool-input"
              placeholder={activeTab.placeholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          ) : (
            <textarea
              className="tool-textarea"
              placeholder={activeTab.placeholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          )}
          <div className="tool-label" style={{ fontSize: '0.82rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Try a sample</div>
          <div className="sample-chips">
            {SAMPLES[tab].map((s, i) => (
              <span key={i} className="chip" onClick={() => setInput(s)}>
                Sample {i + 1}
              </span>
            ))}
          </div>
          <motion.button
            className="btn btn-primary btn-lg"
            onClick={run}
            disabled={loading || !input.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          >
            {loading ? 'Analyzing…' : <>Analyze with Gemini <ArrowRight size={18} /></>}
          </motion.button>
        </div>

        <div className="result-card">
          <AnimatePresence mode="wait">
            {!result && !loading && !error && (
              <motion.div key="empty" className="result-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="ring"><Shield size={30} /></div>
                <div style={{ fontWeight: 600, color: '#333' }}>Your verdict will appear here</div>
                <div style={{ fontSize: '0.88rem', marginTop: 6 }}>Pick a sample or paste your own content, then run Aegis.</div>
              </motion.div>
            )}

            {loading && (
              <motion.div key="loading" className="result-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="ring"><Sparkles size={30} /></div>
                <div style={{ fontWeight: 600, color: '#333' }}>Gemini is scanning…</div>
                <div className="loading-row" style={{ justifyContent: 'center' }}>
                  <span className="loading-pulse" />
                  <span className="loading-pulse" />
                  <span className="loading-pulse" />
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div key="err" className="result-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="ring" style={{ background: '#FEE2E2', color: '#DC2626' }}><AlertCircle size={30} /></div>
                <div style={{ fontWeight: 600, color: '#B91C1C' }}>Backend unreachable</div>
                <div style={{ fontSize: '0.88rem', marginTop: 6 }}>{error}</div>
              </motion.div>
            )}

            {result && !loading && (
              <motion.div key="res" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <ResultView result={result} tab={tab} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function ResultView({ result, tab }) {
  const score = tab === 'ai'
    ? (result.ai_likelihood ?? 0)
    : (result.threat_score ?? 0)
  const verdict = result.verdict || 'UNKNOWN'
  const flags = result.red_flags || result.indicators || []
  const actions = result.recommended_actions || (result.recommendation ? [result.recommendation] : [])
  const explanation = result.explanation || ''
  const scoreLabel = tab === 'ai' ? 'AI likelihood' : 'Threat score'

  return (
    <>
      <div className="result-header">
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888' }}>
            Aegis Verdict
          </div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className={`verdict-pill verdict-${verdict}`}>{verdict.replace(/_/g, ' ')}</span>
            {result.scam_type && result.scam_type !== 'None' && (
              <span style={{ fontSize: '0.82rem', color: '#666', fontWeight: 600 }}>
                · {result.scam_type}
              </span>
            )}
            {result.impersonating && result.impersonating !== 'none' && (
              <span style={{ fontSize: '0.82rem', color: '#666', fontWeight: 600 }}>
                · Impersonating {result.impersonating}
              </span>
            )}
          </div>
        </div>
        <ScoreRing score={score} verdict={verdict} />
      </div>

      {explanation && (
        <div className="explanation">
          {explanation}
        </div>
      )}

      {flags.length > 0 && (
        <>
          <div className="result-section-title">Red flags</div>
          <div className="flag-list">
            {flags.slice(0, 6).map((f, i) => (
              <div key={i} className="flag-item">
                <span className={`flag-dot sev-${(f.severity || 'medium').toLowerCase()}`}></span>
                <div>
                  <div className="flag-name">{f.flag || f.indicator}</div>
                  <div className="flag-detail">{f.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {actions.length > 0 && (
        <>
          <div className="result-section-title">What to do</div>
          <ul className="action-list">
            {actions.map((a, i) => (
              <li key={i}>
                <CheckCircle2 size={16} />
                {a}
              </li>
            ))}
          </ul>
        </>
      )}

      {result.offline_mode && (
        <div style={{ fontSize: '0.78rem', color: '#888', marginTop: 8 }}>
          Running in offline heuristic mode — set <code>GEMINI_API_KEY</code> for full AI analysis.
        </div>
      )}
    </>
  )
}
