const AEGIS_API = 'http://localhost:8010/api/webhook/scan'

document.getElementById('go').addEventListener('click', async () => {
  const content = document.getElementById('t').value.trim()
  const r = document.getElementById('result')
  if (!content) { r.textContent = 'Enter something to scan.'; return }
  r.innerHTML = 'Scanning…'
  try {
    const kind = /^https?:\/\//i.test(content) ? 'url' : 'message'
    const resp = await fetch(AEGIS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, kind }),
    })
    const { result } = await resp.json()
    const score = result.threat_score ?? 0
    const verdict = result.verdict || 'UNKNOWN'
    const cls = score >= 80 ? 'd' : score >= 55 ? 's' : score >= 25 ? 's' : 'ok'
    r.innerHTML = `
      <span class="pill ${cls}">${verdict.replace(/_/g, ' ')} · ${score}/100</span>
      <div>${(result.explanation || '').slice(0, 300)}</div>
    `
  } catch {
    r.textContent = 'Could not reach Aegis backend (http://localhost:8010).'
  }
})
