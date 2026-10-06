import React from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Zap, AlertTriangle, Phone, Eye, Lock } from 'lucide-react'

const HERO_IMG = 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=900&q=80'
const HERO_IMG_FALLBACK = 'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=900&q=80'

export default function Hero() {
  return (
    <section className="hero hero-split">
      {/* floating decorative tiles */}
      <div className="float p1 yellow"><Zap size={28} color="#B45309" strokeWidth={2.5} /></div>
      <div className="float p2 blue"><Phone size={26} strokeWidth={2.5} /></div>
      <div className="float p3 orange"><AlertTriangle size={28} strokeWidth={2.5} /></div>
      <div className="float p4 purple"><Lock size={26} strokeWidth={2.5} /></div>
      <div className="float p5 white"><Eye size={22} color="#333" strokeWidth={2.5} /></div>
      <div className="float p6 white"><ShieldCheck size={22} color="#FF5A1F" strokeWidth={2.5} /></div>

      <div className="hero-split-grid">
        <div className="hero-text">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            The AI shield that <br />
            <span className="accent">beats AI scams.</span>
          </motion.h1>

          <motion.p
            className="lead"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Aegis AI detects phishing, voice-clone fraud, deepfake text, and impersonation scams in real time —
            so grandparents, employees, and everyday people never fall for the next AI trick.
          </motion.p>

          <motion.div
            className="hero-cta"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <a href="#scanner" className="btn btn-primary btn-lg">Scan a Message</a>
            <a href="#features" className="btn btn-ghost btn-lg">How it works</a>
          </motion.div>
        </div>

        <motion.div
          className="hero-visual"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.2, 0.9, 0.3, 1.2] }}
        >
          <div className="hero-img-wrap">
            <img
              src={HERO_IMG}
              onError={(e) => { if (e.target.src !== HERO_IMG_FALLBACK) e.target.src = HERO_IMG_FALLBACK }}
              alt="Person safely using a phone — protected by Aegis AI"
              className="hero-img"
              loading="eager"
            />
            <div className="hero-img-tag">
              <span className="dot-live" />
              <span>Scam blocked · 2s ago</span>
            </div>
            <div className="hero-img-badge">
              <ShieldCheck size={18} />
              <div>
                <div className="hero-img-badge-t">PROTECTED</div>
                <div className="hero-img-badge-s">Aegis AI active</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
