import { useMemo, useState } from 'react'
import type { TestRendererProps } from '../types'
import { sfx } from '../sounds'
import { useLang } from '../i18n'
import { FeedbackBanner } from '../activities/shared'
import { scramble } from './grading'

/** Starters R&W part 3: look at the picture and put the letters in order. */
export function SpellLetters({ item, onGraded }: TestRendererProps) {
  const { t } = useLang()
  const answer = item.answer ?? ''
  const tiles = useMemo(() => scramble(answer), [answer])
  const [used, setUsed] = useState<number[]>([])
  const [result, setResult] = useState<boolean | null>(null)
  const typed = used.map((i) => tiles[i]).join('')

  const tap = (i: number) => {
    if (result !== null || used.includes(i)) return
    const next = [...used, i]
    setUsed(next)
    if (next.length === tiles.length) {
      const ok = next.map((j) => tiles[j]).join('') === answer
      setResult(ok)
      if (ok) sfx.correct(); else sfx.wrong()
      onGraded(ok ? 1 : 0, 1)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center font-bold text-ink-soft">{t.letters_help}</p>
      <div className="text-center text-7xl">{item.emoji}</div>
      <div className="flex flex-wrap justify-center gap-1">
        {tiles.map((_, i) => (
          <span key={i} className={`flex h-12 w-10 items-center justify-center rounded-lg border-b-4 font-display text-2xl font-extrabold ${
            result === null ? 'border-sand-deep' : result ? 'border-jungle text-jungle-deep' : 'border-coral text-coral-deep'}`}>
            {typed[i] ?? ''}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {tiles.map((ch, i) => (
          <button key={i} onClick={() => tap(i)} disabled={result !== null || used.includes(i)}
            className={`btn-chunky h-12 w-12 text-2xl ${used.includes(i) ? 'opacity-25' : 'bg-sun border-sun-deep text-white'}`}
            style={{ borderWidth: '2px 2px 4px' }}>
            {ch}
          </button>
        ))}
      </div>
      {result === null && used.length > 0 && (
        <button onClick={() => setUsed(used.slice(0, -1))}
          className="btn-chunky mx-auto bg-white border-sand-deep px-5 py-1 text-lg" style={{ borderWidth: '2px 2px 4px' }}>⌫ {t.undo}</button>
      )}
      <FeedbackBanner status={result === null ? 'idle' : result ? 'correct' : 'reveal'} answer={answer} />
    </div>
  )
}

export default SpellLetters
