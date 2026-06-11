// Tiny WebAudio synth — no audio files needed. All effects are short,
// soft and kid-friendly.

let ctx: AudioContext | null = null

function ac(): AudioContext | null {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  delay = 0,
  volume = 0.12,
) {
  const audio = ac()
  if (!audio) return
  const start = audio.currentTime + delay
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(volume, start + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(gain).connect(audio.destination)
  osc.start(start)
  osc.stop(start + duration + 0.05)
}

export const sfx = {
  click() {
    tone(550, 0.07, 'square', 0, 0.06)
  },
  // Decelerating ticks matching the ~3.2s wheel spin
  spin() {
    let t = 0
    let gap = 0.045
    while (t < 3.1) {
      tone(900, 0.025, 'square', t, 0.05)
      t += gap
      gap = Math.min(0.3, gap * 1.09)
    }
    tone(523, 0.15, 'triangle', 3.15, 0.12)
    tone(784, 0.25, 'triangle', 3.25, 0.12)
  },
  correct() {
    tone(660, 0.1, 'triangle')
    tone(880, 0.18, 'triangle', 0.09)
  },
  wrong() {
    tone(280, 0.18, 'sine', 0, 0.09)
    tone(230, 0.22, 'sine', 0.12, 0.09)
  },
  roundDone() {
    tone(523, 0.12, 'triangle')
    tone(659, 0.12, 'triangle', 0.1)
    tone(784, 0.22, 'triangle', 0.2)
  },
  levelUp() {
    ;[523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', i * 0.13, 0.14))
    tone(1319, 0.4, 'triangle', 0.55, 0.12)
  },
  hatch() {
    tone(300, 0.08, 'square', 0, 0.08)
    tone(350, 0.08, 'square', 0.15, 0.08)
    tone(400, 0.08, 'square', 0.3, 0.08)
    ;[784, 988, 1175].forEach((f, i) => tone(f, 0.3, 'triangle', 0.5 + i * 0.12, 0.13))
  },
  evolve() {
    for (let i = 0; i < 12; i++) tone(400 + i * 90, 0.07, 'triangle', i * 0.05, 0.08)
    tone(1568, 0.35, 'triangle', 0.62, 0.13)
  },
  flip() {
    tone(440, 0.06, 'triangle', 0, 0.06)
  },
}
