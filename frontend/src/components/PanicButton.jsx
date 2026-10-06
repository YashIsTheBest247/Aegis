import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X, PhoneOff, Shield, Users, ChevronLeft, Globe } from 'lucide-react'

const STEPS = [
  {
    title: 'Hang up. Right now.',
    body: 'Legitimate agencies and companies will never pressure you with "stay on the line" or "do not hang up". Hanging up is always safe.',
    icon: PhoneOff,
    color: '#EF4444',
  },
  {
    title: 'Do not share codes, SSN, or passwords.',
    body: 'No real bank, government agency, or support team ever asks for your full SSN, password, 2FA code, or bank login over the phone or text.',
    icon: Shield,
    color: '#F97316',
  },
  {
    title: 'Verify through a known channel.',
    body: 'Open your bank app or go to the official website directly. Call the number on the back of your card. Never use the number the caller gave you.',
    icon: Users,
    color: '#0284C7',
  },
  {
    title: 'If money already left — act fast.',
    body: 'Call your bank immediately to try to reverse the transfer. Report to the hotlines below. Freeze your credit at your country\'s credit bureaus.',
    icon: AlertTriangle,
    color: '#8B5CF6',
  },
]

const COUNTRIES = [
  {
    code: 'US', name: 'United States', flag: '🇺🇸',
    hotlines: [
      { label: 'FTC Fraud', number: '1-877-382-4357', href: 'tel:1-877-382-4357' },
      { label: 'FBI IC3', number: 'ic3.gov', href: 'https://www.ic3.gov' },
      { label: '988 Crisis', number: '988', href: 'tel:988' },
    ],
  },
  {
    code: 'UK', name: 'United Kingdom', flag: '🇬🇧',
    hotlines: [
      { label: 'Action Fraud', number: '0300 123 2040', href: 'tel:03001232040' },
      { label: 'Emergency', number: '999', href: 'tel:999' },
      { label: 'Samaritans', number: '116 123', href: 'tel:116123' },
    ],
  },
  {
    code: 'IN', name: 'India', flag: '🇮🇳',
    hotlines: [
      { label: 'Cyber Crime', number: '1930', href: 'tel:1930' },
      { label: 'Police', number: '112', href: 'tel:112' },
      { label: 'iCall Crisis', number: '9152987821', href: 'tel:9152987821' },
    ],
  },
  {
    code: 'CA', name: 'Canada', flag: '🇨🇦',
    hotlines: [
      { label: 'CAFC Fraud', number: '1-888-495-8501', href: 'tel:1-888-495-8501' },
      { label: 'Emergency', number: '911', href: 'tel:911' },
      { label: 'Crisis Line', number: '988', href: 'tel:988' },
    ],
  },
  {
    code: 'AU', name: 'Australia', flag: '🇦🇺',
    hotlines: [
      { label: 'Scamwatch', number: '1300 795 995', href: 'tel:1300795995' },
      { label: 'Emergency', number: '000', href: 'tel:000' },
      { label: 'Lifeline', number: '13 11 14', href: 'tel:131114' },
    ],
  },
  {
    code: 'DE', name: 'Germany', flag: '🇩🇪',
    hotlines: [
      { label: 'Police', number: '110', href: 'tel:110' },
      { label: 'BSI (cyber)', number: '0800 274 1000', href: 'tel:08002741000' },
      { label: 'Telefonseelsorge', number: '0800 111 0 111', href: 'tel:08001110111' },
    ],
  },
  {
    code: 'FR', name: 'France', flag: '🇫🇷',
    hotlines: [
      { label: 'Info Escroqueries', number: '0 805 805 817', href: 'tel:0805805817' },
      { label: 'Police', number: '17', href: 'tel:17' },
      { label: 'Suicide Écoute', number: '3114', href: 'tel:3114' },
    ],
  },
  {
    code: 'OTHER', name: 'Other / Not listed', flag: '🌍',
    hotlines: [
      { label: 'Local Police', number: 'dial local emergency', href: '#' },
      { label: 'FBI IC3 (international)', number: 'ic3.gov', href: 'https://www.ic3.gov' },
      { label: 'Open Counseling', number: 'opencounseling.com', href: 'https://blog.opencounseling.com/suicide-hotlines/' },
    ],
  },
]

const COUNTRY_KEY = 'aegis_country'

export default function PanicButton() {
  const [open, setOpen] = useState(false)
  const [country, setCountry] = useState(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(COUNTRY_KEY)
      if (saved) {
        const match = COUNTRIES.find((c) => c.code === saved)
        if (match) setCountry(match)
      }
    } catch {}
  }, [])

  const close = () => setOpen(false)

  const pickCountry = (c) => {
    setCountry(c)
    try { localStorage.setItem(COUNTRY_KEY, c.code) } catch {}
  }

  const changeCountry = () => setCountry(null)

  return (
    <>
      <motion.button
        className="panic-fab"
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        aria-label="Emergency scam help"
      >
        <AlertTriangle size={20} />
        <span>Being scammed?</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="panic-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          >
            <motion.div
              className="panic-modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            >
              <button className="panic-close" onClick={close} aria-label="Close">
                <X size={18} />
              </button>

              {!country ? (
                <CountryPicker onPick={pickCountry} />
              ) : (
                <EmergencyGuide country={country} onChangeCountry={changeCountry} />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function CountryPicker({ onPick }) {
  return (
    <>
      <div className="panic-head">
        <div className="panic-head-ico" style={{ background: '#DBEAFE', color: '#1E40AF' }}>
          <Globe size={28} />
        </div>
        <div>
          <div className="panic-eyebrow" style={{ color: '#1E40AF' }}>STEP 1 OF 2</div>
          <h3>Pick your country — we'll show the right hotlines.</h3>
        </div>
      </div>

      <div className="country-grid">
        {COUNTRIES.map((c) => (
          <motion.button
            key={c.code}
            className="country-tile"
            onClick={() => onPick(c)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
          >
            <span className="country-flag">{c.flag}</span>
            <span className="country-name">{c.name}</span>
          </motion.button>
        ))}
      </div>

      <div style={{ fontSize: '0.78rem', color: '#888', marginTop: 16, textAlign: 'center' }}>
        We save your choice locally so you never have to pick again.
      </div>
    </>
  )
}

function EmergencyGuide({ country, onChangeCountry }) {
  return (
    <>
      <div className="panic-head">
        <div className="panic-head-ico"><AlertTriangle size={28} /></div>
        <div style={{ flex: 1 }}>
          <div className="panic-eyebrow">EMERGENCY GUIDE</div>
          <h3>Breathe. You're not alone — here's exactly what to do.</h3>
        </div>
      </div>

      <div className="panic-steps">
        {STEPS.map((s, i) => {
          const I = s.icon
          return (
            <motion.div
              key={s.title}
              className="panic-step"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <div className="panic-step-num">{i + 1}</div>
              <div className="panic-step-ico" style={{ color: s.color, background: `${s.color}22` }}>
                <I size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="panic-step-title">{s.title}</div>
                <div className="panic-step-body">{s.body}</div>
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="panic-hotlines">
        <div className="panic-hotlines-head">
          <div className="panic-hotlines-title">
            <span style={{ fontSize: '1.1rem', marginRight: 6 }}>{country.flag}</span>
            Immediate hotlines · {country.name}
          </div>
          <button className="panic-change" onClick={onChangeCountry}>
            <ChevronLeft size={14} /> Change country
          </button>
        </div>
        <div className="panic-hotline-row">
          {country.hotlines.map((h) => (
            <a
              key={h.label}
              href={h.href}
              target={h.href.startsWith('http') ? '_blank' : undefined}
              rel="noreferrer"
              className="panic-hotline"
            >
              <strong>{h.label}</strong>
              <span>{h.number}</span>
            </a>
          ))}
        </div>
      </div>
    </>
  )
}
