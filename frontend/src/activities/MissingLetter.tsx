import { useEffect, useMemo, useRef, useState } from 'react'
import type { ItemResult } from '../types'
import { speak } from '../tts'
import { useLang } from '../i18n'
import { WordIcon } from '../components/CalendarIcon'
import { type ActivityProps, FeedbackBanner, ListenButtons, ProgressDots, shuffle } from './shared'

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'

/** Missing letter: one letter is blanked out; tap the right one. */
export function MissingLetter({ items, onAnswer, onFinish }: ActivityProps) {
  const { t } = useLang()
  const [index, setIndex] = useState(0)
  const [status, setStatus] = useState<'idle' | 'wrong1' | 'reveal' | 'correct'>('idle')
  const [wrongPicks, setWrongPicks] = useState<string[]>([])
  const [results, setResults] = useState<ItemResult[]>([])
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const item = items[index]
  const answer = (item?.answer ?? '').trim()

  // Blank one letter (never the first) and offer 4 letter choices
  const { gapIndex, options } = useMemo(() => {
    const chars = answer.split('')
    const candidates = chars
      .map((c, i) => ({ c, i }))
      .filter(({ c, i }) => i > 0 && /[a-zA-Z]/.test(c))
    if (candidates.length === 0) return { gapIndex: -1, options: [] as string[] }
    const pick = candidates[Math.floor(Math.random() * candidates.length)]
    const correct = pick.c.toLowerCase()
    const pool = ALPHABET.replace(correct, '').split('')
    const distractors = shuffle(pool).slice(0, 3)
    return { gapIndex: pick.i, options: shuffle([correct, ...distractors]) }
  }, [answer])

  const correctLetter = gapIndex >= 0 ? answer[gapIndex].toLowerCase() : ''

  useEffect(() => {
    setStatus('idle')
    setWrongPicks([])
    if (answer) speak(answer)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [index, answer])

  if (!item) return null

  const advance = (correct: boolean) => {
    const next = [...results, { word_id: item.word_id, correct }]
    setResults(next)
    timer.current = setTimeout(() => {
      if (index + 1 < items.length) setIndex(index + 1)
      else onFinish(next)
    }, 1400)
  }

  const pick = (letter: string) => {
    if (status === 'correct' || status === 'reveal') return
    if (letter === correctLetter) {
      setStatus('correct')
      speak(answer)
      onAnswer(true)
      advance(wrongPicks.length === 0)
    } else {
      onAnswer(false)
      if (wrongPicks.length === 0) {
        setWrongPicks([letter])
        setStatus('wrong1')
      } else {
        setWrongPicks([...wrongPicks, letter])
        setStatus('reveal')
        advance(false)
      }
    }
  }

  const solved = status === 'correct' || status === 'reveal'

  return (
    <div className="flex flex-col gap-5">
      <ProgressDots total={items.length} current={index} />
      <p className="text-center font-bold text-ink-soft">{t.missing_help}</p>
      <div className="text-center">
        <WordIcon word={answer} emoji={item.emoji} fallback="🔡" />
      </div>
      <ListenButtons text={answer} />

      <div className="flex flex-wrap justify-center gap-1.5">
        {answer.split('').map((ch, i) => {
          if (ch === ' ') return <span key={i} className="w-4" />
          const isGap = i === gapIndex
          return (
            <span
              key={i}
              className={`flex h-14 w-10 items-center justify-center rounded-xl border-2 font-display text-2xl font-extrabold ${
                isGap
                  ? solved
                    ? status === 'correct'
                      ? 'border-jungle bg-jungle-pale text-jungle-deep animate-pop'
                      : 'border-coral bg-coral-pale text-coral-deep animate-pop'
                    : 'border-sky bg-white text-sky-deep shadow-[0_0_0_3px_rgba(74,163,223,0.25)]'
                  : 'border-sand-deep bg-white text-ink'
              }`}
            >
              {isGap ? (solved ? ch : '?') : ch}
            </span>
          )
        })}
      </div>

      <div className="grid grid-cols-4 gap-3">
        {options.map((letter) => {
          const isWrong = wrongPicks.includes(letter)
          return (
            <button
              key={letter}
              onClick={() => pick(letter)}
              disabled={isWrong}
              className={`btn-chunky py-4 font-display text-2xl font-extrabold ${
                isWrong
                  ? 'bg-coral-pale border-coral text-coral-deep opacity-60 animate-shake'
                  : 'bg-white border-sand-deep text-ink'
              }`}
              style={{ borderWidth: '2px 2px 6px' }}
            >
              {letter}
            </button>
          )
        })}
      </div>
      <FeedbackBanner status={status} hint={item.hint} answer={answer} />
    </div>
  )
}
