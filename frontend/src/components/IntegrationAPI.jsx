import React, { useState } from 'react'
import { Copy, Check, Terminal, Code2, Globe } from 'lucide-react'

const SNIPPETS = {
  curl: {
    label: 'cURL',
    icon: Terminal,
    code: `curl -X POST http://localhost:8010/api/webhook/scan \\
  -H "Content-Type: application/json" \\
  -d '{
    "content": "Your Chase account is locked. Click http://chase-verify.co",
    "kind": "message"
  }'`,
  },
  javascript: {
    label: 'JavaScript',
    icon: Code2,
    code: `// Protect any user-facing input before showing it
async function scan(message) {
  const r = await fetch('http://localhost:8010/api/webhook/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: message, kind: 'message' }),
  })
  const { result } = await r.json()
  if (result.threat_score > 60) {
    alert('⚠ Likely scam: ' + result.explanation)
  }
  return result
}`,
  },
  python: {
    label: 'Python',
    icon: Code2,
    code: `# Drop into any Python app, bot, or Slack handler
import httpx

def scan_message(text: str) -> dict:
    r = httpx.post(
        "http://localhost:8010/api/webhook/scan",
        json={"content": text, "kind": "message"},
    )
    return r.json()["result"]

verdict = scan_message("URGENT: wire $85k to this vendor")
if verdict["threat_score"] > 60:
    print("Blocked:", verdict["explanation"])`,
  },
  webhook: {
    label: 'Webhook',
    icon: Globe,
    code: `# Point your email provider / SMS gateway / chat app
# at this URL — Aegis returns a verdict synchronously.

POST /api/webhook/scan HTTP/1.1
Host: your-aegis-host:8010
Content-Type: application/json
X-API-Key: <your-key>

{
  "content": "<the message or URL>",
  "kind": "message | url | call | ai-text"
}

# Response
{
  "ok": true,
  "result": {
    "threat_score": 92,
    "verdict": "DANGEROUS",
    "scam_type": "Phishing",
    "red_flags": [...],
    "recommended_actions": [...]
  }
}`,
  },
}

export default function IntegrationAPI() {
  const [tab, setTab] = useState('curl')
  const [copied, setCopied] = useState(false)
  const snippet = SNIPPETS[tab]

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* ignore */ }
  }

  return (
    <div className="api-wrap">
      <div className="api-left">
        <span className="eyebrow">INTEGRATE AEGIS</span>
        <h2 style={{ marginTop: 14 }}>One endpoint.<br />Every app you build.</h2>
        <p style={{ marginTop: 20, maxWidth: 420 }}>
          Add Aegis's scam shield to your own app, email client, chat bot, SMS gateway, or Slack workflow with a single POST request.
          Return a verdict in &lt; 2 seconds. Works with any language that speaks HTTP.
        </p>
        <div style={{ display: 'flex', gap: 20, marginTop: 32, flexWrap: 'wrap' }}>
          <div className="api-mini">
            <div className="api-mini-num">1</div>
            <div>
              <div className="api-mini-label">POST a message</div>
              <div className="api-mini-sub">Any string, up to 10 KB</div>
            </div>
          </div>
          <div className="api-mini">
            <div className="api-mini-num">2</div>
            <div>
              <div className="api-mini-label">Get a verdict</div>
              <div className="api-mini-sub">Score + red flags + actions</div>
            </div>
          </div>
          <div className="api-mini">
            <div className="api-mini-num">3</div>
            <div>
              <div className="api-mini-label">Block or warn</div>
              <div className="api-mini-sub">Based on threat score</div>
            </div>
          </div>
        </div>
      </div>

      <div className="api-right">
        <div className="api-code-header">
          <div className="api-code-tabs">
            {Object.entries(SNIPPETS).map(([k, s]) => {
              const I = s.icon
              return (
                <button key={k} className={`api-code-tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>
                  <I size={14} /> {s.label}
                </button>
              )
            })}
          </div>
          <button className="api-copy" onClick={copy}>
            {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
          </button>
        </div>
        <pre className="api-code"><code>{snippet.code}</code></pre>
      </div>
    </div>
  )
}
