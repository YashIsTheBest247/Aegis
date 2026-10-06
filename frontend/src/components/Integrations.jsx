import React from 'react'
import { Mail, MessageCircle, Phone, Globe, Smartphone, Settings2 } from 'lucide-react'

export default function Integrations() {
  return (
    <div className="integrations">
      <div className="icon-tile">
        <Settings2 size={32} />
      </div>
      <h2>Plug Aegis into the places<br />scams actually reach you</h2>
      <p style={{ marginTop: 20, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
        One API, every channel. Wrap Gmail, SMS, WhatsApp, voice calls, or your own app in a Gemini-powered scam shield.
      </p>
      <div className="integration-row">
        <div style={{ textAlign: 'center' }}>
          <div className="int-tile" style={{ background: '#F6F5F2' }}>
            <Mail size={38} color="#EA4335" />
          </div>
          <div className="int-caption" style={{ marginTop: 10 }}>Gmail</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div className="int-tile" style={{ background: '#F6F5F2' }}>
            <MessageCircle size={38} color="#25D366" />
          </div>
          <div className="int-caption" style={{ marginTop: 10 }}>WhatsApp</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div className="int-tile featured" style={{ background: '#fff' }}>
            <svg viewBox="0 0 48 48" width="56" height="56">
              <defs>
                <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0" stopColor="#FF7A3D" />
                  <stop offset="1" stopColor="#FF5A1F" />
                </linearGradient>
              </defs>
              <path fill="url(#g1)" d="M24 4 L40 10 V22 C40 32 32 40 24 44 C16 40 8 32 8 22 V10 Z" />
              <path d="M18 24 L22 28 L30 20" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <div className="int-caption" style={{ marginTop: 10 }}>Aegis AI</div>
          <div className="int-sub">Real-time scam shield</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div className="int-tile" style={{ background: '#F6F5F2' }}>
            <Phone size={38} color="#0284C7" />
          </div>
          <div className="int-caption" style={{ marginTop: 10 }}>Voice</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div className="int-tile" style={{ background: '#F6F5F2' }}>
            <Smartphone size={38} color="#8B5CF6" />
          </div>
          <div className="int-caption" style={{ marginTop: 10 }}>SMS</div>
        </div>
      </div>
    </div>
  )
}
