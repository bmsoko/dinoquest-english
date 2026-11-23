import { useMemo, useState } from 'react'
import type { TestRendererProps } from '../types'
import { sfx } from '../sounds'
import { FeedbackBanner, shuffle } from '../activities/shared'

export function Mcq({ item, onGraded }: TestRendererProps) {
  const [picked, setPicked] = useState<string | null>(null)
  const answer = item.answer ?? ''
  const options = useMemo(() => shuffle(item.options ?? []), [item])

  const choose = (opt: string) => {
    if (picked !== null) return
    setPicked(opt)
    const correct = opt === answer
    correct ? sfx.correct() : sfx.wrong()
    onGraded(correct ? 1 : 0, 1)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center font-display text-2xl font-extrabold text-ink">{item.prompt}</p>
      <div className="flex flex-col gap-3">
        {options.map((opt) => {
          const state = picked === null ? 'idle' : opt === answer ? 'good' : opt === picked ? 'bad' : 'idle'
          return (
            <button
              key={opt}
              onClick={() => choose(opt)}
              disabled={picked !== null}
              className={`btn-chunky text-xl px-6 py-3 ${
                state === 'good' ? 'bg-jungle border-jungle-deep text-white'
                : state === 'bad' ? 'bg-coral border-coral-deep text-white'
                : 'bg-white border-sand-deep text-ink'}`}
              style={{ borderWidth: '2px 2px 5px' }}
            >
              {opt}
            </button>
          )
        })}
      </div>
      <FeedbackBanner status={picked === null ? 'idle' : picked === answer ? 'correct' : 'reveal'} answer={answer} />
    </div>
  )
}

export default Mcq
