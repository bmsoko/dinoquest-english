import { useMemo, useState } from 'react'
import type { TestRendererProps } from '../types'
import { sfx } from '../sounds'
import { useLang } from '../i18n'
import { FeedbackBanner, shuffle } from '../activities/shared'

export function Order({ item, onGraded }: TestRendererProps) {
  const { t } = useLang()
  const tokens = item.tokens ?? []
  const answer = item.answer ?? ''
  const pool = useMemo(() => shuffle(tokens.map((tok, i) => ({ tok, i }))), [item])
  const [built, setBuilt] = useState<number[]>([]) // indices into pool
  const [done, setDone] = useState(false)

  const add = (poolIdx: number) => {
    if (done || built.includes(poolIdx)) return
    const next = [...built, poolIdx]
    setBuilt(next)
    if (next.length === pool.length) {
      setDone(true)
      const sentence = next.map((p) => pool[p].tok).join(' ')
      const correct = sentence === answer
      correct ? sfx.correct() : sfx.wrong()
      onGraded(correct ? 1 : 0, 1)
    }
  }

  const sentence = built.map((p) => pool[p].tok).join(' ')

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center font-bold text-ink-soft">{t.order_help}</p>
      <div className="min-h-12 rounded-xl border-2 border-sand-deep bg-white px-3 py-2 text-center font-display text-xl font-extrabold text-ink">
        {sentence || ' '}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {pool.map((p, idx) => (
          <button key={idx} onClick={() => add(idx)} disabled={done || built.includes(idx)}
            className={`btn-chunky px-4 py-2 text-lg ${built.includes(idx) ? 'opacity-30' : 'bg-berry border-berry-deep text-white'}`}
            style={{ borderWidth: '2px 2px 4px' }}>
            {p.tok}
          </button>
        ))}
      </div>
      <FeedbackBanner status={!done ? 'idle' : sentence === answer ? 'correct' : 'reveal'} answer={answer} />
    </div>
  )
}

export default Order
