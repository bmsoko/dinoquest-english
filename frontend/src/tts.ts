let cachedVoice: SpeechSynthesisVoice | null = null

function pickEnglishVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice
  const voices = window.speechSynthesis.getVoices()
  const preferred = [
    'Google US English',
    'Google UK English Female',
    'Samantha',
    'Daniel',
    'Karen',
  ]
  for (const name of preferred) {
    const v = voices.find((v) => v.name === name)
    if (v) return (cachedVoice = v)
  }
  const anyEn = voices.find((v) => v.lang.startsWith('en'))
  return (cachedVoice = anyEn ?? null)
}

// Voices load asynchronously on some browsers
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = null
    pickEnglishVoice()
  }
}

export function speak(text: string, slow = false): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) return resolve()
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    const voice = pickEnglishVoice()
    if (voice) utterance.voice = voice
    utterance.lang = voice?.lang ?? 'en-US'
    utterance.rate = slow ? 0.55 : 0.85
    utterance.pitch = 1.05
    utterance.onend = () => resolve()
    utterance.onerror = () => resolve()
    window.speechSynthesis.speak(utterance)
  })
}
