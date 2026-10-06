import React from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import StatsStrip from './components/StatsStrip'
import Features from './components/Features'
import Scanner from './components/Scanner'
import LiveFeed from './components/LiveFeed'
import UseCases from './components/UseCases'
import IntegrationAPI from './components/IntegrationAPI'
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
          <p>Powered by Gemini 2.0. Every signal in a scam — language, links, voice, images, timing — scored in real time.</p>
        </div>
        <Features />
      </section>

      <section className="section" id="scanner" style={{ background: '#F0EFEC' }}>
        <div className="section-head">
          <span className="eyebrow">Try Aegis live</span>
          <h2>Scan anything suspicious.</h2>
          <p>Message, email, URL, call transcript, screenshot, or voice recording — Gemini verdict in seconds.</p>
        </div>
        <Scanner />
        <div style={{ marginTop: 48 }}>
          <LiveFeed />
        </div>
      </section>

      <section className="section" id="usecases">
        <div className="section-head">
          <span className="eyebrow">Who Aegis protects</span>
          <h2>Built for the people AI scammers target most.</h2>
          <p>From grandparents to Fortune 500 finance teams — the same AI, same shield, zero friction.</p>
        </div>
        <UseCases />
      </section>

      <section className="section" id="integrate" style={{ background: '#F0EFEC' }}>
        <IntegrationAPI />
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
