import React from 'react'
import { Heart, Briefcase, Users, Smartphone } from 'lucide-react'

const CASES = [
  {
    title: 'For families protecting elders',
    body: 'Grandparents lose billions every year to voice-clone and impersonation scams. Forward any suspicious message to Aegis and get a plain-English verdict you can share.',
    icon: Heart,
    tint: '#FFE4D6', tintC: '#C2410C',
    img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=900&q=80',
    stat: '68% of victims are 60+',
  },
  {
    title: 'For small businesses & finance teams',
    body: 'A finance clerk receiving a fake "CEO wire request" can paste it into Aegis before sending $85 K. Protects HR, AP, and procurement workflows.',
    icon: Briefcase,
    tint: '#EDE4FF', tintC: '#6D28D9',
    img: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=900&q=80',
    stat: '$25M lost in one deepfake call',
  },
  {
    title: 'For messaging apps & telcos',
    body: 'Embed the Aegis API in Gmail, WhatsApp, SMS gateways, or Slack to flag scams before they ever reach the inbox. One POST request, one JSON verdict.',
    icon: Smartphone,
    tint: '#D6F0FA', tintC: '#0369A1',
    img: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=900&q=80',
    stat: 'Drop-in webhook integration',
  },
  {
    title: 'For everyone else',
    body: 'Dating apps, marketplaces, email, school parent groups — anywhere strangers talk to you about money. Aegis is open source and free forever.',
    icon: Users,
    tint: '#DCFCE7', tintC: '#15803D',
    img: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=900&q=80',
    stat: '46% is a coin flip — do better',
  },
]

export default function UseCases() {
  return (
    <div className="usecase-grid">
      {CASES.map((c) => {
        const I = c.icon
        return (
          <div className="usecase-card" key={c.title}>
            <div className="usecase-img-wrap">
              <img
                src={c.img}
                alt=""
                className="usecase-img"
                loading="lazy"
                onError={(e) => { e.target.style.display = 'none' }}
              />
              <div className="usecase-img-gradient" />
              <div className="usecase-badge" style={{ background: c.tint, color: c.tintC }}>
                <I size={16} /> {c.stat}
              </div>
            </div>
            <div className="usecase-body">
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
