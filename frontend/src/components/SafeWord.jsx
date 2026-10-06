import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, RefreshCw, Copy, Check, Share2, Users } from 'lucide-react'

// A simple curated word list — easy to remember, hard to guess
const WORDS = [
  'crimson', 'maple', 'orbit', 'piano', 'canyon', 'velvet', 'harbor', 'cedar',
  'ember', 'violet', 'lantern', 'sage', 'copper', 'horizon', 'thistle', 'mango',
  'quartz', 'spruce', 'ivory', 'willow', 'tangerine', 'cobalt', 'juniper', 'nebula',
  'opal', 'rust', 'brook', 'vista', 'glacier', 'saffron', 'linen', 'moss',
]

function pick() {
  const a = WORDS[Math.floor(Math.random() * WORDS.length)]
  let b = WORDS[Math.floor(Math.random() * WORDS.length)]
  while (b === a) b = WORDS[Math.floor(Math.random() * WORDS.length)]
  return `${a}-${b}`
}

export default function SafeWord() {
  const [word, setWord] = useState('')
  const [copied, setCopied] = useState(false)
  const [custom, setCustom] = useState('')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('aegis_safeword')
      if (saved) { setWord(saved); return }
    } catch {}
    setWord(pick())
  }, [])

  const save = (w) => {
    setWord(w)
    try { localStorage.setItem('aegis_safeword', w) } catch {}
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(word)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  const share = async () => {
    const text = `Our family safe word is: ${word}\n\nIf someone calls or texts claiming to be family in an emergency, ask them for the safe word. If they don't know it, hang up.\n\nStay safe,\nAegis AI`
    if (navigator.share) {
      try { await navigator.share({ title: 'Family Safe Word', text }) } catch {}
    } else {
      try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch {}
    }
  }

  return (
    <div className="safeword-wrap">
      <div className="safeword-left">
        <span className="eyebrow">FAMILY SAFE WORD</span>
        <h2 style={{ marginTop: 14 }}>Beat voice-clone scams with one shared word.</h2>
        <p style={{ marginTop: 16, maxWidth: 460 }}>
          AI can clone a voice from three seconds of social media audio. A pre-agreed family safe word
          beats every deepfake in existence. Share one with your parents, kids, and grandparents today.
        </p>
        <div className="safeword-steps">
          <div className="safeword-step">
            <div className="safeword-step-n">1</div>
            <div>Generate or pick a word only your family knows.</div>
          </div>
          <div className="safeword-step">
            <div className="safeword-step-n">2</div>
            <div>Share it in person or over a trusted channel — never SMS.</div>
          </div>
          <div className="safeword-step">
            <div className="safeword-step-n">3</div>
            <div>In any "emergency" call, ask: "What's the safe word?" No answer, hang up.</div>
          </div>
        </div>
      </div>

      <motion.div
        className="safeword-card"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="safeword-chip"><Shield size={14} /> Your family's safe word</div>
        <motion.div
          key={word}
          className="safeword-value"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {word}
        </motion.div>
        <div className="safeword-actions">
          <button className="btn btn-ghost" onClick={() => save(pick())}>
            <RefreshCw size={14} /> New word
          </button>
          <button className="btn btn-dark" onClick={copy}>
            {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
          </button>
          <button className="btn btn-primary" onClick={share}>
            <Share2 size={14} /> Share
          </button>
        </div>

        <div className="safeword-custom">
          <input
            placeholder="Or type your own…"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            maxLength={40}
          />
          <button
            className="btn btn-ghost"
            onClick={() => { if (custom.trim()) { save(custom.trim()); setCustom('') } }}
          >
            <Users size={14} /> Use this
          </button>
        </div>
        <div className="safeword-note">Saved privately in your browser. Never sent to any server.</div>
      </motion.div>
    </div>
  )
}
