import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, Link2, Phone, Bot, Image as ImageIcon, Mic,
  Sparkles, Shield, AlertCircle, CheckCircle2, ArrowRight, Upload,
  Play, Square, Trash2,
} from 'lucide-react'

const TABS = [
  { id: 'message', label: 'Message / Email', icon: MessageSquare, placeholder: 'Paste a suspicious SMS, email, DM, or chat message here…', endpoint: '/api/analyze/message', field: 'message', kind: 'text' },
  { id: 'url', label: 'URL / Link', icon: Link2, placeholder: 'https://example.com', endpoint: '/api/analyze/url', field: 'url', kind: 'text' },
  { id: 'call', label: 'Call Transcript', icon: Phone, placeholder: 'Paste a transcript of a suspicious call or voicemail…', endpoint: '/api/analyze/call', field: 'transcript', kind: 'text' },
  { id: 'ai', label: 'AI-Text Detector', icon: Bot, placeholder: 'Paste any text to detect if it was AI-generated…', endpoint: '/api/analyze/deepfake-text', field: 'text', kind: 'text' },
  { id: 'image', label: 'Screenshot', icon: ImageIcon, placeholder: 'Upload a screenshot of a suspicious message, website, or notification.', endpoint: '/api/analyze/image', kind: 'image' },
  { id: 'voice', label: 'Voice Recording', icon: Mic, placeholder: 'Record a suspicious voice message or paste call audio.', endpoint: '/api/analyze/audio', kind: 'audio' },
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
  const [file, setFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [recording, setRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const [audioBlob, setAudioBlob] = useState(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const fileInputRef = useRef(null)

  const activeTab = TABS.find((t) => t.id === tab)

  const resetState = () => {
    setResult(null); setInput(''); setFile(null); setFilePreview(null)
    setAudioUrl(null); setAudioBlob(null); setError(null)
  }

  const onPickFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    const url = URL.createObjectURL(f)
    setFilePreview(url)
  }

  const onDrop = (e) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (!f) return
    setFile(f)
    setFilePreview(URL.createObjectURL(f))
  }

  const startRecord = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = (e) => chunksRef.current.push(e.data)
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((t) => t.stop())
      }
      mediaRecorderRef.current = mr
      mr.start()
      setRecording(true)
    } catch (e) {
      setError('Microphone access denied. Allow mic permission and try again.')
    }
  }

  const stopRecord = () => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  const run = async () => {
    setLoading(true); setError(null); setResult(null)
    try {
      let res
      if (activeTab.kind === 'image') {
        if (!file) throw new Error('Pick a screenshot first.')
        const fd = new FormData()
        fd.append('file', file)
        res = await fetch(activeTab.endpoint, { method: 'POST', body: fd })
      } else if (activeTab.kind === 'audio') {
        if (!audioBlob) throw new Error('Record audio first.')
        const fd = new FormData()
        fd.append('file', audioBlob, 'recording.webm')
        res = await fetch(activeTab.endpoint, { method: 'POST', body: fd })
      } else {
        if (!input.trim()) throw new Error('Enter something to scan.')
        res = await fetch(activeTab.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [activeTab.field]: input }),
        })
      }
      if (!res.ok) throw new Error(`Server returned ${res.status}`)
      const data = await res.json()
      setResult(data)
    } catch (e) {
      setError(e.message || 'Could not reach Aegis backend. Is the FastAPI server running on port 8010?')
    } finally {
      setLoading(false)
    }
  }

  const canRun = loading ? false
    : activeTab.kind === 'image' ? !!file
    : activeTab.kind === 'audio' ? !!audioBlob
    : !!input.trim()

  return (
    <div className="tool-wrap">
      <div className="tool-tabs">
        {TABS.map((t) => {
          const I = t.icon
          return (
            <button
              key={t.id}
              className={`tool-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => { setTab(t.id); resetState() }}
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

          {activeTab.kind === 'text' && (tab === 'url' ? (
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
          ))}

          {activeTab.kind === 'image' && (
            <div
              className="drop-zone"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
            >
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={onPickFile}
                style={{ display: 'none' }}
              />
              {!filePreview ? (
                <>
                  <div className="dz-ring"><Upload size={28} /></div>
                  <div style={{ fontWeight: 600, color: '#333' }}>Click to upload or drag a screenshot here</div>
                  <div style={{ fontSize: '0.85rem', color: '#999', marginTop: 4 }}>
                    Gemini will OCR the text + flag visual scam signals
                  </div>
                </>
              ) : (
                <>
                  <img src={filePreview} alt="screenshot preview" className="dz-preview" />
                  <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <button className="btn btn-ghost" onClick={(e) => { e.stopPropagation(); setFile(null); setFilePreview(null) }}>
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab.kind === 'audio' && (
            <div className="drop-zone">
              {!audioUrl ? (
                <>
                  <div className={`dz-ring ${recording ? 'rec' : ''}`}>
                    <Mic size={28} />
                  </div>
                  <div style={{ fontWeight: 600, color: '#333' }}>
                    {recording ? 'Recording… tap stop when done' : 'Click record and paste the suspicious voicemail'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#999', marginTop: 4 }}>
                    Gemini transcribes + scores deepfake voice likelihood
                  </div>
                  <div style={{ marginTop: 16 }}>
                    {!recording ? (
                      <button className="btn btn-primary" onClick={startRecord}>
                        <Play size={16} /> Start Recording
                      </button>
                    ) : (
                      <button className="btn btn-dark" onClick={stopRecord}>
                        <Square size={14} /> Stop
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <audio controls src={audioUrl} style={{ width: '100%' }} />
                  <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <button className="btn btn-ghost" onClick={() => { setAudioUrl(null); setAudioBlob(null) }}>
                      <Trash2 size={14} /> Discard
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab.kind === 'text' && SAMPLES[tab] && (
            <>
              <div className="tool-label" style={{ fontSize: '0.82rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Try a sample</div>
              <div className="sample-chips">
                {SAMPLES[tab].map((s, i) => (
                  <span key={i} className="chip" onClick={() => setInput(s)}>
                    Sample {i + 1}
                  </span>
                ))}
              </div>
            </>
          )}

          <motion.button
            className="btn btn-primary btn-lg"
            onClick={run}
            disabled={!canRun}
            whileHover={{ scale: canRun ? 1.02 : 1 }}
            whileTap={{ scale: canRun ? 0.94 : 1 }}
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
                <div style={{ fontSize: '0.88rem', marginTop: 6 }}>Pick a sample, upload a screenshot, or record audio.</div>
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
                <div style={{ fontWeight: 600, color: '#B91C1C' }}>Something went wrong</div>
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

      {result.extracted_text && (
        <>
          <div className="result-section-title">Text read from image</div>
          <div className="explanation" style={{ fontStyle: 'italic', fontSize: '0.88rem' }}>
            "{result.extracted_text}"
          </div>
        </>
      )}

      {result.transcript && (
        <>
          <div className="result-section-title">Transcript</div>
          <div className="explanation" style={{ fontStyle: 'italic', fontSize: '0.88rem' }}>
            "{result.transcript}"
          </div>
        </>
      )}

      {explanation && (
        <div className="explanation">
          {explanation}
        </div>
      )}

      {result.deepfake_voice_likelihood !== undefined && (
        <div className="deepfake-meter">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontWeight: 700, color: '#111', fontSize: '0.85rem' }}>Deepfake voice likelihood</span>
            <span style={{ fontWeight: 700, color: '#FF5A1F' }}>{result.deepfake_voice_likelihood}%</span>
          </div>
          <div className="bar"><div className="bar-fill" style={{ width: `${result.deepfake_voice_likelihood}%` }} /></div>
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
