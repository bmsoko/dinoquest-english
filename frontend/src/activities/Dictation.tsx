import { useEffect, useMemo, useRef, useState } from 'react'
import type { ItemResult } from '../types'
import { speak } from '../tts'
import { useLang } from '../i18n'
import { type ActivityProps, FeedbackBanner, ListenButtons, ProgressDots } from './shared'

// Spelling: the kid types LETTERS ONLY — spaces and punctuation are handled
// automatically (early-primary practice targets letter knowledge, not word
// boundaries).
export function Dictation({ items, onAnswer, onFinish }: ActivityProps) {
  const { t } = useLang()
  const [index, setIndex] = useState(0)
  const [typed, setTyped] = useState('')
  const [status, setStatus] = useState<'idle' | 'wrong1' | 'reveal' | 'correct'>('idle')
  const [attempts, setAttempts] = useState(0)
  const [results, setResults] = useState<ItemResult[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const item = items[index]
  const target = item?.text ?? ''
  // Strip trailing punctuation; keep apostrophes etc. inside words out of typing too
  const cleanTarget = useMemo(() => target.replace(/[.?!]$/, ''), [target])
  const targetLetters = useMemo(
    () => cleanTarget.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(),
    [cleanTarget],
  )

  useEffect(() => {
    if (target) speak(target)
    setTyped('')
    setStatus('idle')
    setAttempts(0)
    inputRef.current?.focus()
  }, [index, target])

  if (!item) return null

  const advance = (correct: boolean) => {
    const newResults = [...results, { word_id: item.word_id, correct }]
    setResults(newResults)
    setTimeout(() => {
      if (index + 1 < items.length) setIndex(index + 1)
      else onFinish(newResults)
    }, 1400)
  }

  const check = () => {
    if (status === 'correct' || status === 'reveal') return
    if (typed.toLowerCase() === targetLetters) {
      setStatus('correct')
      onAnswer(true)
      advance(attempts === 0)
    } else {
      onAnswer(false)
      if (attempts === 0) {
        setAttempts(1)
        setStatus('wrong1')
        speak(target, true)
      } else {
        setStatus('reveal')
        setTyped(targetLetters)
        advance(false)
      }
    }
  }

  // Letter boxes follow the sentence layout; non-letter chars (spaces,
  // apostrophes) render as fixed separators the kid never types.
  let letterCursor = 0
  const cells = cleanTarget.split('').map((ch, i) => {
    if (!/[a-zA-Z0-9]/.test(ch)) return { key: i, sep: ch }
    return { key: i, sep: null, letterIndex: letterCursor++ }
  })

  return (
    <div className="flex flex-col gap-5">
      <ProgressDots total={items.length} current={index} />
      <p className="text-center font-bold text-ink-soft">{t.dictation_help}</p>
      <div className="text-center text-5xl">{item.emoji || '✏️'}</div>
      <ListenButtons text={target} />

      <div
        className="flex flex-wrap justify-center gap-1.5 cursor-text min-h-12"
        onClick={() => inputRef.current?.focus()}
      >
        {cells.map((cell) => {
          if (cell.sep !== null) {
            return cell.sep === ' ' ? (
              <span key={cell.key} className="w-5" />
            ) : (
              <span key={cell.key} className="flex h-12 items-end pb-1 font-display text-2xl font-extrabold text-ink-soft">
                {cell.sep}
              </span>
            )
          }
          const li = cell.letterIndex!
          const typedCh = typed[li]
          const expectCh = targetLetters[li]
          const state =
            typedCh === undefined ? 'empty' : typedCh.toLowerCase() === expectCh ? 'good' : 'bad'
          return (
            <span
              key={cell.key}
              className={`flex h-12 w-9 items-center justify-center rounded-xl border-2 font-display text-2xl font-extrabold transition-colors ${
                state === 'good'
                  ? 'border-jungle bg-jungle-pale text-jungle-deep'
                  : state === 'bad'
                    ? 'border-coral bg-coral-pale text-coral-deep'
                    : 'border-sand-deep bg-white text-ink-soft'
              } ${li === typed.length ? 'border-sky shadow-[0_0_0_3px_rgba(74,163,223,0.3)]' : ''}`}
            >
              {typedCh ?? ''}
            </span>
          )
        })}
      </div>

      <input
        ref={inputRef}
        value={typed}
        onChange={(e) =>
          status !== 'correct' &&
          status !== 'reveal' &&
          setTyped(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, targetLetters.length))
        }
        onKeyDown={(e) => e.key === 'Enter' && check()}
        className="absolute opacity-0 pointer-events-none"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
      />

      <button
        onClick={check}
        disabled={typed.length === 0 || status === 'correct' || status === 'reveal'}
        className="btn-chunky bg-sun border-sun-deep text-white text-xl px-8 py-3 mx-auto"
      >
        {t.check} ✓
      </button>
      <FeedbackBanner status={status} hint={item.hint} answer={cleanTarget} />
    </div>
  )
}
