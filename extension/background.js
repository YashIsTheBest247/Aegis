// Aegis AI — Chrome extension service worker
// Adds a right-click option to scan selected text with the Aegis backend.

const AEGIS_API = 'http://localhost:8010/api/webhook/scan'

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'aegis-scan',
    title: 'Aegis AI → Scan this for scams',
    contexts: ['selection', 'link'],
  })
})

chrome.contextMenus.onClicked.addListener(async (info) => {
  const content = info.selectionText || info.linkUrl
  if (!content) return
  const kind = info.linkUrl ? 'url' : 'message'

  try {
    const res = await fetch(AEGIS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, kind }),
    })
    const { result } = await res.json()

    const score = result.threat_score ?? 0
    const verdict = result.verdict || 'UNKNOWN'
    const emoji = score >= 80 ? '🚨' : score >= 55 ? '⚠' : score >= 25 ? '🟡' : '✅'
    const title = `${emoji} Aegis: ${verdict.replace(/_/g, ' ')} (${score}/100)`
    const message = result.explanation || 'Scan complete.'

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon128.png',
      title,
      message: message.slice(0, 240),
      priority: 2,
    })
  } catch (e) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon128.png',
      title: 'Aegis AI unreachable',
      message: 'Start the Aegis backend on http://localhost:8010',
    })
  }
})
