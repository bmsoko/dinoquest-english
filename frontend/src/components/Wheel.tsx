import { useRef, useState } from 'react'
import type { ActivityType } from '../types'
import { sfx } from '../sounds'
import { useLang } from '../i18n'

export const SEGMENTS: { type: ActivityType; color: string; emoji: string }[] = [
  { type: 'listen_choose', color: '#4aa3df', emoji: '👂' },
  { type: 'dictation', color: '#1d9e75', emoji: '✏️' },
  { type: 'unscramble', color: '#f0704b', emoji: '🧩' },
  { type: 'fill_in', color: '#f5a623', emoji: '📝' },
  { type: 'memory', color: '#9b6ddb', emoji: '🃏' },
  { type: 'anagram', color: '#0f6e56', emoji: '🔤' },
  { type: 'missing_letter', color: '#c14d2c', emoji: '🔡' },
  { type: 'sentence_spelling', color: '#26709f', emoji: '📜' },
]

export function activityLabel(type: ActivityType, t: ReturnType<typeof useLang>['t']): string {
  switch (type) {
    case 'listen_choose': return t.listen_choose_title
    case 'dictation': return t.dictation_title
    case 'unscramble': return t.unscramble_title
    case 'fill_in': return t.fill_in_title
    case 'memory': return t.memory_title
    case 'anagram': return t.anagram_title
    case 'missing_letter': return t.missing_title
    case 'sentence_spelling': return t.sentence_title
  }
}

const SEG_ANGLE = 360 / SEGMENTS.length

export function Wheel({ onResult }: { onResult: (type: ActivityType) => void }) {
  const { t } = useLang()
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const wheelRef = useRef<HTMLDivElement>(null)

  const spin = () => {
    if (spinning) return
    setSpinning(true)
    sfx.spin()
    const pickedIndex = Math.floor(Math.random() * SEGMENTS.length)
    // Land the picked segment's center under the top pointer
    const target =
      rotation +
      1800 +
      ((360 - ((rotation + pickedIndex * SEG_ANGLE + SEG_ANGLE / 2) % 360)) % 360)
    setRotation(target)
    setTimeout(() => {
      setSpinning(false)
      onResult(SEGMENTS[pickedIndex].type)
    }, 3300)
  }

  const gradient = SEGMENTS.map(
    (s, i) => `${s.color} ${i * SEG_ANGLE}deg ${(i + 1) * SEG_ANGLE}deg`,
  ).join(', ')

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <div className="absolute left-1/2 -top-2 z-10 -translate-x-1/2 text-3xl drop-shadow-md">🔻</div>
        <div
          ref={wheelRef}
          className="relative h-64 w-64 rounded-full border-8 border-white shadow-xl"
          style={{
            background: `conic-gradient(${gradient})`,
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? 'transform 3.2s cubic-bezier(0.15, 0.9, 0.28, 1)' : 'none',
          }}
        >
          {SEGMENTS.map((s, i) => {
            const angle = i * SEG_ANGLE + SEG_ANGLE / 2
            return (
              <div
                key={s.type}
                className="absolute left-1/2 top-1/2 text-3xl"
                style={{
                  transform: `rotate(${angle}deg) translateY(-86px) rotate(-${angle}deg) translate(-50%, -50%)`,
                }}
              >
                {s.emoji}
              </div>
            )
          })}
          <div className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-inner flex items-center justify-center text-2xl">
            🦖
          </div>
        </div>
      </div>
      <button
        onClick={spin}
        disabled={spinning}
        className="btn-chunky bg-jungle border-jungle-deep text-white text-2xl px-10 py-4"
      >
        {spinning ? t.spinning : t.spin_wheel}
      </button>
    </div>
  )
}
