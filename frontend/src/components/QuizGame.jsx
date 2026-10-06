import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Check, X, Sparkles, RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react'

export default function QuizGame() {
  const [items, setItems] = useState([])
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [answer, setAnswer] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    try {
      const r = await fetch('/api/quiz/items')
      const d = await r.json()
      setItems(d.items || [])
      setIdx(0); setScore(0); setAnswer(null)
    } catch { /* ignore */ }
  }

  useEffect(() => { load() }, [])

  const current = items[idx]
  const done = items.length > 0 && idx >= items.length

  const guess = async (isScam) => {
    if (!current || answer || loading) return
    setLoading(true)
    try {
      const r = await fetch('/api/quiz/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: current.id, guess: isScam }),
      })
      const d = await r.json()
      setAnswer({ guessed: isScam, ...d })
      if (d.correct) setScore((s) => s + 1)
    } finally {
      setLoading(false)
    }
  }

  const next = () => {
    setAnswer(null)
    setIdx((i) => i + 1)
  }

  if (!items.length) return <div className="quiz-wrap"><div style={{ textAlign: 'center', color: '#888' }}>Loading quiz…</div></div>

  if (done) {
    const pct = Math.round((score / items.length) * 100)
    const badge = pct >= 90 ? 'Scam Buster' : pct >= 70 ? 'Sharp Eye' : pct >= 50 ? 'Getting There' : 'Keep Practicing'
    return (
      <div className="quiz-wrap quiz-done">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
          <div className="quiz-trophy"><Trophy size={32} /></div>
          <h3 style={{ marginTop: 16 }}>You scored {score} / {items.length}</h3>
          <div style={{ marginTop: 10, fontSize: '1.1rem', fontWeight: 700, color: 'var(--orange)' }}>{badge}</div>
          <p style={{ marginTop: 10, maxWidth: 440 }}>
            Humans only catch AI-generated phishing 46% of the time. You just scored {pct}%.
            Share this result with your family and run them through it too — it's the single best defense.
          </p>
          <button className="btn btn-primary btn-lg" style={{ marginTop: 24 }} onClick={load}>
            <RefreshCw size={16} /> Play again
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="quiz-wrap">
      <div className="quiz-head">
        <div className="quiz-progress">
          Round <strong>{idx + 1}</strong> of {items.length}
        </div>
        <div className="quiz-score">
          <Trophy size={14} /> Score: <strong>{score}</strong>
        </div>
      </div>

      <div className="quiz-progress-bar">
        <motion.div
          className="quiz-progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${((idx + (answer ? 1 : 0)) / items.length) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="quiz-card"
        >
          <div className="quiz-label">Would you trust this?</div>
          <div className="quiz-text">"{current.text}"</div>

          {!answer ? (
            <div className="quiz-actions">
              <motion.button
                className="btn btn-ghost btn-lg quiz-btn-safe"
                onClick={() => guess(false)}
                disabled={loading}
                whileTap={{ scale: 0.95 }}
              >
                <ShieldCheck size={18} /> Looks safe
              </motion.button>
              <motion.button
                className="btn btn-primary btn-lg quiz-btn-scam"
                onClick={() => guess(true)}
                disabled={loading}
                whileTap={{ scale: 0.95 }}
              >
                <ShieldAlert size={18} /> It's a scam
              </motion.button>
            </div>
          ) : (
            <motion.div
              className={`quiz-feedback ${answer.correct ? 'correct' : 'wrong'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="quiz-feedback-head">
                {answer.correct ? <><Check size={20} /> Correct!</> : <><X size={20} /> Not quite.</>}
                <span className="quiz-feedback-tag">
                  {answer.is_scam ? `${answer.scam_type}` : 'Legitimate'}
                </span>
              </div>
              <div className="quiz-feedback-why">
                {answer.why}
              </div>
              <button className="btn btn-dark" style={{ marginTop: 14 }} onClick={next}>
                {idx + 1 >= items.length ? 'See results' : 'Next round'} <Sparkles size={16} />
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
