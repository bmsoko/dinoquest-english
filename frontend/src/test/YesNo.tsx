import { useState } from 'react'
import type { TestRendererProps } from '../types'
import { sfx } from '../sounds'
import { useLang } from '../i18n'

/** Starters R&W part 1 (style "tick": ✓/✗ per picture) and part 2 (style "word": yes/no about one scene). */
export function YesNo({ item, onGraded }: TestRendererProps) {
  const { t } = useLang()
  const statements = item.statements ?? []
  const [picks, setPicks] = useState<('yes' | 'no' | null)[]>(statements.map(() => null))
  const done = picks.every((p) => p !== null)
  const tick = item.style === 'tick'

  const pick = (i: number, v: 'yes' | 'no') => {
    if (done || picks[i] !== null) return
    const next = [...picks]
    next[i] = v
    setPicks(next)
    if (next.every((p) => p !== null)) {
      const correct = next.filter((p, j) => p === statements[j].answer).length
      if (correct === statements.length) sfx.correct(); else sfx.wrong()
      onGraded(correct, statements.length)
    }
  }

  const label = (v: 'yes' | 'no') => (tick ? (v === 'yes' ? '✓' : '✗') : v)

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center font-bold text-ink-soft">{tick ? t.tick_help : t.yesno_help}</p>
      {item.scene && (
        <div className="rounded-2xl bg-sand px-3 py-4 text-center text-5xl leading-snug tracking-wide">{item.scene}</div>
      )}
      <div className="flex flex-col gap-3">
        {statements.map((s, i) => {
          const p = picks[i]
          const right = p !== null && p === s.answer
          return (
            <div key={i} className={`flex items-center gap-3 rounded-2xl border-2 px-3 py-2 ${
              p === null ? 'border-sand-deep bg-white' : right ? 'border-jungle bg-jungle-pale' : 'border-coral bg-coral-pale'}`}>
              {s.emoji && <span className="text-5xl">{s.emoji}</span>}
              <span className="flex-1 font-display text-xl font-bold text-ink">{s.text}</span>
              {(['yes', 'no'] as const).map((v) => (
                <button key={v} onClick={() => pick(i, v)} disabled={p !== null}
                  className={`btn-chunky min-w-14 px-3 py-2 text-xl ${
                    p === v ? (right ? 'bg-jungle border-jungle-deep text-white' : 'bg-coral border-coral-deep text-white')
                    : p !== null && v === s.answer ? 'bg-jungle-pale border-jungle text-jungle-deep'
                    : 'bg-white border-sand-deep text-ink'}`}
                  style={{ borderWidth: '2px 2px 4px' }}>
                  {label(v)}
                </button>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default YesNo
