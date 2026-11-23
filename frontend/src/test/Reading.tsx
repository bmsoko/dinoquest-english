import { useMemo, useState } from 'react'
import type { TestRendererProps } from '../types'
import { sfx } from '../sounds'
import { useLang } from '../i18n'
import { FeedbackBanner, shuffle } from '../activities/shared'

export function Reading({ item, onGraded }: TestRendererProps) {
  const { t } = useLang()
  const questions = item.questions ?? []
  const [qIndex, setQIndex] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const q = questions[qIndex]
  const opts = useMemo(() => shuffle(q.options), [qIndex])

  const choose = (opt: string) => {
    if (picked !== null) return
    setPicked(opt)
    const right = opt === q.answer
    right ? sfx.correct() : sfx.wrong()
    const newScore = score + (right ? 1 : 0)
    setScore(newScore)
    setTimeout(() => {
      if (qIndex + 1 < questions.length) {
        setQIndex(qIndex + 1)
        setPicked(null)
      } else {
        onGraded(newScore, questions.length)
      }
    }, 1200)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center font-bold text-ink-soft">{t.reading_help}</p>
      <div className="rounded-xl border-2 border-sand-deep bg-sand/40 p-4 font-bold text-ink">
        {item.passage}
      </div>
      <p className="font-display text-xl font-extrabold text-ink">
        {qIndex + 1}. {q.q}
      </p>
      <div className="flex flex-col gap-2">
        {opts.map((opt) => {
          const state = picked === null ? 'idle' : opt === q.answer ? 'good' : opt === picked ? 'bad' : 'idle'
          return (
            <button key={opt} onClick={() => choose(opt)} disabled={picked !== null}
              className={`btn-chunky px-5 py-2 text-left text-lg ${
                state === 'good' ? 'bg-jungle border-jungle-deep text-white'
                : state === 'bad' ? 'bg-coral border-coral-deep text-white'
                : 'bg-white border-sand-deep text-ink'}`}
              style={{ borderWidth: '2px 2px 4px' }}>
              {opt}
            </button>
          )
        })}
      </div>
      <FeedbackBanner status={picked === null ? 'idle' : picked === q.answer ? 'correct' : 'reveal'} answer={q.answer} />
    </div>
  )
}

export default Reading
