import React from 'react'
import { MessageSquare, Link2, Phone, Bot, BookOpen, ShieldCheck } from 'lucide-react'

const FEATURES = [
  {
    icon: MessageSquare,
    bg: '#FFE4D6', color: '#FF5A1F',
    title: 'Message Scanner',
    body: 'Paste a suspicious SMS or email. Gemini extracts red flags, scam category, urgency tactics, and a 0–100 threat score.',
    span: false,
  },
  {
    icon: Link2,
    bg: '#EDE4FF', color: '#8B5CF6',
    title: 'URL / Phishing Check',
    body: 'Detects typosquatting, look-alike domains, and shady TLDs. Suggests the real safe URL when a brand is being impersonated.',
    span: false,
  },
  {
    icon: Phone,
    bg: '#D6F0FA', color: '#0284C7',
    title: 'Voice Call Analyzer',
    body: 'Paste a call transcript — Aegis flags grandparent, IRS, tech-support, and voice-clone scams with a deepfake likelihood score.',
    span: false,
  },
  {
    icon: Bot,
    bg: '#FFF4D1', color: '#B45309',
    title: 'AI-Generated Text Detector',
    body: 'Spots mass phishing, fake reviews, and impersonation content written by ChatGPT, Claude, or Gemini — before it fools you.',
    span: true,
  },
  {
    icon: BookOpen,
    bg: '#DCFCE7', color: '#15803D',
    title: 'Scam Playbook Library',
    body: 'Learn the 8 most common scams, red flags, and what to do if targeted. Share with family in one tap.',
    span: false,
  },
]

export default function Features() {
  return (
    <div className="bento">
      {FEATURES.map((f) => {
        const Icon = f.icon
        return (
          <div key={f.title} className={`bento-card ${f.span ? 'span-2' : ''}`}>
            <div className="icon-tile" style={{ background: f.bg, color: f.color }}>
              <Icon size={28} strokeWidth={2.3} />
            </div>
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </div>
        )
      })}
    </div>
  )
}
