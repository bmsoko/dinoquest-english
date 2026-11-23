import { useMemo, useState } from 'react'
import type { TestRendererProps } from '../types'
import { sfx } from '../sounds'
import { useLang } from '../i18n'
import { shuffle } from '../activities/shared'

export function GapBank({ item, onGraded }: TestRendererProps) {
  const { t } = useLang()
  const sentences = item.sentences ?? []
  const bankWords = useMemo(() => shuffle(item.bank ?? []), [item])
  const [fills, setFills] = useState<(string | null)[]>(sentences.map(() => null))
  const [done, setDone] = useState(false)

  const activeBlank = fills.findIndex((f) => f === null)
  const used = new Set(fills.filter(Boolean) as string[])

  const place = (word: string) => {
    if (done || activeBlank === -1 || used.has(word)) return
    const next = [...fills]
    next[activeBlank] = word
    setFills(next)
    if (next.every((f) => f !== null)) {
      setDone(true)
      const correct = next.filter((f, i) => f === sentences[i].answer).length
      correct === sentences.length ? sfx.correct() : sfx.wrong()
      onGraded(correct, sentences.length)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center font-bold text-ink-soft">{t.gap_help}</p>
      {item.title && <p className="text-center font-display text-xl font-extrabold text-ink">{item.title}</p>}
      <div className="flex flex-col gap-2">
        {sentences.map((s, i) => {
          const fill = fills[i]
          const state = !done ? 'idle' : fill === s.answer ? 'good' : 'bad'
          const [before, after] = s.text.split('___')
          return (
            <p key={i} className="font-display text-lg text-ink">
              {before}
              <span className={`inline-block min-w-16 rounded-lg border-2 px-2 text-center ${
                state === 'good' ? 'border-jungle bg-jungle-pale'
                : state === 'bad' ? 'border-coral bg-coral-pale'
                : i === activeBlank ? 'border-sky bg-sky/10' : 'border-sand-deep bg-white'}`}>
                {fill ?? ' '}
              </span>
              {after}
              {done && state === 'bad' && <span className="ml-2 font-bold text-jungle-deep">({s.answer})</span>}
            </p>
          )
        })}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {bankWords.map((w) => (
          <button key={w} onClick={() => place(w)} disabled={done || used.has(w)}
            className={`btn-chunky px-4 py-2 text-lg ${used.has(w) ? 'opacity-30' : 'bg-sun border-sun-deep text-white'}`}
            style={{ borderWidth: '2px 2px 4px' }}>
            {item.bank_emoji?.[w] && <span className="mr-1">{item.bank_emoji[w]}</span>}{w}
          </button>
        ))}
      </div>
    </div>
  )
}

export default GapBank
