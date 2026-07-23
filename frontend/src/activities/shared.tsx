import type { ExerciseItem, ItemResult } from '../types'
import { speak } from '../tts'
import { useLang } from '../i18n'

export interface ActivityProps {
  items: ExerciseItem[]
  onAnswer: (correct: boolean) => void
  onFinish: (results: ItemResult[]) => void
}

export function ListenButtons({
  text,
  autoFocus = false,
  onAfterSpeak,
}: {
  text: string
  autoFocus?: boolean
  /** Hand focus back to the typing field so the kid can keep spelling. */
  onAfterSpeak?: () => void
}) {
  const { t } = useLang()
  const play = (slow: boolean) => {
    speak(text, slow)
    onAfterSpeak?.()
  }
  return (
    <div className="flex justify-center gap-3">
      <button
        autoFocus={autoFocus}
        onClick={() => play(false)}
        className="btn-chunky bg-sky border-sky-deep text-white text-lg px-6 py-3"
      >
        🔊 {t.listen}
      </button>
      <button
        onClick={() => play(true)}
        className="btn-chunky bg-white border-sand-deep text-ink text-lg px-5 py-3"
        style={{ borderWidth: '2px 2px 6px' }}
      >
        🐢 {t.slow}
      </button>
    </div>
  )
}

export function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex justify-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-2.5 rounded-full transition-all duration-300 ${
            i < current ? 'w-2.5 bg-jungle' : i === current ? 'w-6 bg-sun' : 'w-2.5 bg-sand-deep'
          }`}
        />
      ))}
    </div>
  )
}

export function FeedbackBanner({
  status,
  hint,
  answer,
}: {
  status: 'idle' | 'wrong1' | 'reveal' | 'correct'
  hint?: string
  answer?: string
}) {
  const { t } = useLang()
  if (status === 'idle') return null
  if (status === 'correct')
    return (
      <div className="animate-pop rounded-2xl bg-jungle-pale border-2 border-jungle px-4 py-2 text-center font-display font-extrabold text-jungle-deep">
        ⭐ {t.correct[0]}
      </div>
    )
  if (status === 'wrong1')
    return (
      <div className="animate-pop rounded-2xl bg-sun-pale border-2 border-sun px-4 py-2 text-center font-bold text-sun-deep">
        {t.almost}
        {hint ? ` · ${t.hint}: ${hint}` : ''}
      </div>
    )
  return (
    <div className="animate-pop rounded-2xl bg-coral-pale border-2 border-coral px-4 py-2 text-center font-bold text-coral-deep">
      {t.answer_was}: <span className="font-display font-extrabold">{answer}</span>
    </div>
  )
}

export function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[.?!,]/g, '')
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
