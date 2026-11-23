import { useEffect, useMemo, useState } from 'react'
import type { TestRendererProps } from '../types'
import { speak } from '../tts'
import { sfx } from '../sounds'
import { useLang } from '../i18n'
import { FeedbackBanner, shuffle } from '../activities/shared'

/** Starters Listening parts 1 and 3: hear a short dialogue, tap the right picture. */
export function ListenPicture({ item, onGraded }: TestRendererProps) {
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
    if (correct) sfx.correct(); else sfx.wrong()
    onGraded(correct ? 1 : 0, 1)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center font-bold text-ink-soft">{item.name ? t.find_person_help : t.picture_help}</p>
      {item.name && (
        <div className="mx-auto rounded-2xl border-2 border-sky bg-sky/10 px-6 py-2 font-display text-3xl font-extrabold text-sky-deep">
          {item.name}
        </div>
      )}
      {item.question && <p className="text-center font-display text-2xl font-extrabold text-ink">{item.question}</p>}
      <button onClick={() => speak(audio)} aria-label={t.listen_again}
        className="btn-chunky mx-auto bg-sky border-sky-deep text-white text-3xl px-10 py-4">🔊</button>
      <div className="grid grid-cols-3 gap-3">
        {options.map((opt) => {
          const state = picked === null ? 'idle' : opt === answer ? 'good' : opt === picked ? 'bad' : 'idle'
          const isWord = /[a-z]/i.test(opt)
          return (
            <button key={opt} onClick={() => choose(opt)} disabled={picked !== null}
              className={`btn-chunky flex min-h-24 items-center justify-center px-2 py-4 ${isWord ? 'text-xl' : 'text-5xl'} ${
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

export default ListenPicture
