import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Sparkles, Shield } from 'lucide-react'

const GREETING = {
  role: 'assistant',
  content: "Hi — I'm Aegis, your anti-scam assistant. Paste a suspicious message or ask me how a scam works, and I'll break it down. What's going on?",
}

const QUICK_PROMPTS = [
  'I got a text saying my package is held up — real?',
  'How does the grandparent voice-clone scam work?',
  'Is a 2% crypto "guaranteed return" legit?',
  'What do I do if I already paid a scammer?',
]

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([GREETING])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollerRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight
    }
  }, [messages, loading])

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  const send = async (text) => {
    const content = (text ?? input).trim()
    if (!content || loading) return
    const next = [...messages, { role: 'user', content }]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const payload = next.filter((m) => m.role !== 'assistant' || m !== GREETING)
      // Keep the full history including greeting so the model has context
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })
      if (!res.ok) throw new Error('Request failed')
      const data = await res.json()
      setMessages((m) => [...m, { role: 'assistant', content: data.reply || '(no reply)' }])
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: "I couldn't reach the Aegis backend. Make sure it's running on port 8010 and try again." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating launcher button (right side) */}
      <motion.button
        className="chatbot-fab"
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        animate={open ? { rotate: 90 } : { rotate: 0 }}
        aria-label={open ? 'Close chat' : 'Open Aegis assistant'}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            className="chatbot-panel"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          >
            <div className="chatbot-head">
              <div className="chatbot-head-left">
                <div className="chatbot-avatar"><Shield size={16} /></div>
                <div>
                  <div className="chatbot-title">Aegis Assistant</div>
                  <div className="chatbot-sub">
                    <span className="dot-live" style={{ marginRight: 6 }} />
                    Online · powered by Gemini
                  </div>
                </div>
              </div>
              <button className="chatbot-close" onClick={() => setOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="chatbot-body" ref={scrollerRef}>
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  className={`chatbot-msg ${m.role}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {m.role === 'assistant' && (
                    <div className="chatbot-msg-avatar"><Shield size={12} /></div>
                  )}
                  <div className="chatbot-bubble">
                    {m.content.split('\n').map((line, j) => (
                      <div key={j}>{line || <br />}</div>
                    ))}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="chatbot-msg assistant">
                  <div className="chatbot-msg-avatar"><Shield size={12} /></div>
                  <div className="chatbot-bubble typing">
                    <span /><span /><span />
                  </div>
                </div>
              )}

              {messages.length === 1 && !loading && (
                <div className="chatbot-quick">
                  {QUICK_PROMPTS.map((q) => (
                    <button key={q} className="chatbot-quick-chip" onClick={() => send(q)}>
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form
              className="chatbot-input-row"
              onSubmit={(e) => { e.preventDefault(); send() }}
            >
              <input
                ref={inputRef}
                className="chatbot-input"
                placeholder="Ask Aegis about a scam, message, or call…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <motion.button
                type="submit"
                className="chatbot-send"
                disabled={!input.trim() || loading}
                whileTap={{ scale: 0.9 }}
                aria-label="Send"
              >
                {loading ? <Sparkles size={16} /> : <Send size={16} />}
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
