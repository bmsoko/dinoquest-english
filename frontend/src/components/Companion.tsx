import { useEffect, useState } from 'react'
import type { OwnedDino } from '../types'
import { useLang } from '../i18n'

export type CompanionMood = 'idle' | 'happy' | 'oops'

export function Companion({ dino, mood }: { dino: OwnedDino | null; mood: CompanionMood }) {
  const { t } = useLang()
  const [bubble, setBubble] = useState<string | null>(null)

  useEffect(() => {
    if (mood === 'happy') {
      setBubble(t.correct[Math.floor(Math.random() * t.correct.length)])
      const id = setTimeout(() => setBubble(null), 1500)
      return () => clearTimeout(id)
    }
    if (mood === 'oops') {
      setBubble('💪')
      const id = setTimeout(() => setBubble(null), 1200)
      return () => clearTimeout(id)
    }
  }, [mood, t])

  const emoji = dino?.emoji ?? '🥚'
  const color = dino?.color ?? '#f5a623'

  return (
    <div className="relative flex flex-col items-center select-none">
      {bubble && (
        <div className="absolute -top-9 animate-pop rounded-2xl bg-white px-3 py-1 font-display font-bold text-sm shadow-md border-2 border-sand-deep whitespace-nowrap z-10">
          {bubble}
        </div>
      )}
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-full text-4xl shadow-inner ${
          mood === 'happy' ? 'animate-bounce-big' : mood === 'oops' ? 'animate-wiggle' : ''
        }`}
        style={{ backgroundColor: color + '33', border: `3px solid ${color}` }}
      >
        {emoji}
      </div>
      {dino && <span className="mt-1 font-display text-xs font-bold text-ink-soft">{dino.name}</span>}
    </div>
  )
}
