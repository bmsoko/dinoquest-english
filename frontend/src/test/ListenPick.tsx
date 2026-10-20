import { useEffect, useMemo, useState } from 'react'
import type { TestRendererProps } from '../types'
import { speak } from '../tts'
import { sfx } from '../sounds'
import { useLang } from '../i18n'
import { FeedbackBanner, shuffle } from '../activities/shared'

export function ListenPick({ item, onGraded }: TestRendererProps) {
  const { t } = useLang()
  const [picked, setPicked] = useState<string | null>(null)
  const answer = item.answer ?? ''
  const audio = item.audio ?? ''
  const options = useMemo(() => shuffle(item.options ?? []), [item])

  useEffect(() => { if (audio) speak(audio) }, [audio])

  const choose = (opt: string) => {
    if (picked !== null) return
    setPicked(opt)
    const correct = opt === answer
    correct ? sfx.correct() : sfx.wrong()
    onGraded(correct ? 1 : 0, 1)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center font-bold text-ink-soft">{t.listen_help}</p>
      <button
        onClick={() => speak(audio)}
        className="btn-chunky mx-auto bg-sky border-sky-deep text-white text-3xl px-10 py-4"
      >
        🔊
      </button>
      <div className="flex flex-col gap-3">
        {options.map((opt) => {
          const state = picked === null ? 'idle' : opt === answer ? 'good' : opt === picked ? 'bad' : 'idle'
          return (
            <button key={opt} onClick={() => choose(opt)} disabled={picked !== null}
              className={`btn-chunky text-xl px-6 py-3 ${
                state === 'good' ? 'bg-jungle border-jungle-deep text-white'
                : state === 'bad' ? 'bg-coral border-coral-deep text-white'
                : 'bg-white border-sand-deep text-ink'}`}
              style={{ borderWidth: '2px 2px 5px' }}>
              {opt}
            </button>
          )
        })}
      </div>
      <FeedbackBanner status={picked === null ? 'idle' : picked === answer ? 'correct' : 'reveal'} answer={answer} />
    </div>
  )
}

export default ListenPick
