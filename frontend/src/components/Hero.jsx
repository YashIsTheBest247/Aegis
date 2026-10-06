import React from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Zap, AlertTriangle, Phone, Eye, Lock } from 'lucide-react'

export default function Hero() {
  return (
    <section className="hero">
      {/* floating decorative tiles */}
      <div className="float p1 yellow"><Zap size={30} color="#B45309" strokeWidth={2.5} /></div>
      <div className="float p2 blue"><Phone size={28} strokeWidth={2.5} /></div>
      <div className="float p3 orange"><AlertTriangle size={30} strokeWidth={2.5} /></div>
      <div className="float p4 purple"><Lock size={28} strokeWidth={2.5} /></div>
      <div className="float p5 white"><Eye size={24} color="#333" strokeWidth={2.5} /></div>
      <div className="float p6 white"><ShieldCheck size={24} color="#FF5A1F" strokeWidth={2.5} /></div>

      <div className="hero-inner">
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
          <a href="#scanner" className="btn btn-primary btn-lg">
            Scan a Message
          </a>
          <a href="#features" className="btn btn-ghost btn-lg">
            How it works
          </a>
        </motion.div>
      </div>
    </section>
  )
}
