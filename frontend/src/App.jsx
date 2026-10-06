import React from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import StatsStrip from './components/StatsStrip'
import Features from './components/Features'
import Scanner from './components/Scanner'
import Integrations from './components/Integrations'
import ScamLibrary from './components/ScamLibrary'
import CTA from './components/CTA'
import Footer from './components/Footer'

export default function App() {
  return (
    <>
      <Navbar />
      <Hero />
      <div className="container" style={{ padding: '0 16px' }}>
        <StatsStrip />
      </div>
      <section className="section" id="features">
        <div className="section-head">
          <span className="eyebrow">What Aegis defends</span>
          <h2>Six shields, one AI brain.</h2>
          <p>Powered by Gemini. Every signal in a scam — language, links, voice, timing — scored in real time.</p>
        </div>
        <Features />
      </section>
      <section className="section" id="scanner" style={{ background: '#F0EFEC' }}>
        <div className="section-head">
          <span className="eyebrow">Try Aegis live</span>
          <h2>Scan anything suspicious.</h2>
          <p>Paste a text message, email, URL, or call transcript. Get a Gemini-powered threat verdict in seconds.</p>
        </div>
        <Scanner />
      </section>
      <section className="section" id="integrations">
        <Integrations />
      </section>
      <section className="section" id="library" style={{ background: '#F0EFEC' }}>
        <div className="section-head">
          <span className="eyebrow">Scam Library</span>
          <h2>Know the playbook, break the trap.</h2>
          <p>The scams we see most. Learn the signs, teach your family, stay safe.</p>
        </div>
        <ScamLibrary />
      </section>
      <section className="section">
        <CTA />
      </section>
      <Footer />
    </>
  )
}
