import { useEffect, useState } from 'react'
import type { TestRendererProps } from '../types'
import { speak } from '../tts'
import { sfx } from '../sounds'
import { useLang } from '../i18n'
import { FeedbackBanner } from '../activities/shared'
import { isAccepted } from './grading'

/** Starters Listening part 2 (listen_write) and R&W part 5 (one_word): type a short answer.
 *  One attempt, like the real exam. Case and articles are ignored. */
export function TypeAnswer({ item, onGraded }: TestRendererProps) {
  const { t } = useLang()
  const [value, setValue] = useState('')
  const [result, setResult] = useState<boolean | null>(null)
  const answer = item.answer ?? ''
  const audio = item.audio ?? ''

  useEffect(() => { if (audio) speak(audio, item.slow) }, [audio, item.slow])

  const check = () => {
    if (result !== null || !value.trim()) return
    const ok = isAccepted(value, answer, item.accept)
    setResult(ok)
    if (ok) sfx.correct(); else sfx.wrong()
    onGraded(ok ? 1 : 0, 1)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center font-bold text-ink-soft">{audio ? t.write_help : t.answer_help}</p>
      {item.emoji && <div className="text-center text-7xl leading-tight">{item.emoji}</div>}
      {audio && (
        <button onClick={() => speak(audio, item.slow)} aria-label={t.listen_again}
          className="btn-chunky mx-auto bg-sky border-sky-deep text-white text-3xl px-10 py-4">🔊</button>
      )}
      <p className="text-center font-display text-2xl font-extrabold text-ink">{item.question}</p>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); check() }}>
        <input value={value} onChange={(e) => setValue(e.target.value)} disabled={result !== null}
          autoCapitalize="off" autoCorrect="off" spellCheck={false} autoComplete="off" aria-label={item.question}
          className={`min-w-0 flex-1 rounded-2xl border-2 px-4 py-3 font-display text-2xl font-extrabold outline-none ${
            result === null ? 'border-sand-deep bg-white focus:border-sky'
            : result ? 'border-jungle bg-jungle-pale' : 'border-coral bg-coral-pale'}`} />
        <button type="submit" disabled={result !== null || !value.trim()}
          className="btn-chunky bg-jungle border-jungle-deep text-white text-xl px-5 disabled:opacity-40">{t.check}</button>
      </form>
      <FeedbackBanner status={result === null ? 'idle' : result ? 'correct' : 'reveal'} answer={answer} />
    </div>
  )
}

export default TypeAnswer
