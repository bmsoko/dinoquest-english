import { useEffect, useState } from 'react'
import type { TestRendererProps } from '../types'
import { speak } from '../tts'
import { sfx } from '../sounds'
import { useLang } from '../i18n'
import { FeedbackBanner } from '../activities/shared'

const SWATCH: Record<string, string> = {
  red: '#ef4444', blue: '#3b82f6', green: '#22c55e', yellow: '#facc15', pink: '#f472b6',
  purple: '#a855f7', orange: '#fb923c', brown: '#92400e', grey: '#9ca3af', black: '#1f2937',
}

/** Starters Listening part 4: tap the thing you hear, then tap its colour. */
export function ListenColour({ item, onGraded }: TestRendererProps) {
  const { t } = useLang()
  const [obj, setObj] = useState<string | null>(null)
  const [col, setCol] = useState<string | null>(null)
  const [done, setDone] = useState<boolean | null>(null)
  const audio = item.audio ?? ''

  useEffect(() => { if (audio) speak(audio) }, [audio])

  const check = () => {
    if (done !== null || !obj || !col) return
    const ok = obj === item.target && col === item.colour
    setDone(ok)
    if (ok) sfx.correct(); else sfx.wrong()
    onGraded(ok ? 1 : 0, 1)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center font-bold text-ink-soft">{t.colour_help}</p>
      <button onClick={() => speak(audio)} aria-label={t.listen_again}
        className="btn-chunky mx-auto bg-sky border-sky-deep text-white text-3xl px-10 py-4">🔊</button>
      <div className="flex flex-wrap justify-center gap-3">
        {(item.objects ?? []).map((o) => {
          const painted = o === obj && col ? SWATCH[col] : undefined
          const isAnswer = done !== null && o === item.target
          return (
            <button key={o} onClick={() => done === null && setObj(o)} disabled={done !== null}
              className={`flex h-20 w-20 items-center justify-center rounded-full border-4 text-5xl ${
                o === obj ? 'border-ink' : 'border-sand-deep'} ${isAnswer ? 'ring-4 ring-jungle' : ''}`}
              style={{ background: painted ?? 'white' }} aria-pressed={o === obj}>
              {o}
            </button>
          )
        })}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {(item.colours ?? []).map((c) => (
          <button key={c} onClick={() => done === null && setCol(c)} disabled={done !== null}
            className={`h-11 w-11 rounded-full border-4 ${c === col ? 'border-ink scale-110' : 'border-white'}`}
            style={{ background: SWATCH[c] }} aria-label={c} title={c} aria-pressed={c === col} />
        ))}
      </div>
      <button onClick={check} disabled={done !== null || !obj || !col}
        className="btn-chunky mx-auto bg-jungle border-jungle-deep text-white text-xl px-8 py-2 disabled:opacity-40">{t.check}</button>
      <FeedbackBanner status={done === null ? 'idle' : done ? 'correct' : 'reveal'}
        answer={`${item.target} ${item.colour}`} />
    </div>
  )
}

export default ListenColour
