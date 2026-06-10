import { useEffect, useRef, useState } from 'react'
import type { ItemResult } from '../types'
import { speak } from '../tts'
import { useLang } from '../i18n'
import { type ActivityProps, FeedbackBanner, ListenButtons, ProgressDots, normalize } from './shared'

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
    if (normalize(typed) === normalize(target)) {
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
        setTyped(target)
        advance(false)
      }
    }
  }

  // Letter-box feedback: compare typed against target char by char
  const targetChars = target.split('')
  const typedNorm = typed

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
        {targetChars.map((ch, i) => {
          if (ch === ' ')
            return <span key={i} className="w-4" />
          const typedCh = typedNorm[i]
          const state =
            typedCh === undefined
              ? 'empty'
              : typedCh.toLowerCase() === ch.toLowerCase()
                ? 'good'
                : 'bad'
          return (
            <span
              key={i}
              className={`flex h-12 w-9 items-center justify-center rounded-xl border-2 font-display text-2xl font-extrabold transition-colors ${
                state === 'good'
                  ? 'border-jungle bg-jungle-pale text-jungle-deep'
                  : state === 'bad'
                    ? 'border-coral bg-coral-pale text-coral-deep'
                    : 'border-sand-deep bg-white text-ink-soft'
              } ${i === typedNorm.length ? 'border-sky shadow-[0_0_0_3px_rgba(74,163,223,0.3)]' : ''}`}
            >
              {typedCh ?? ''}
            </span>
          )
        })}
      </div>

      <input
        ref={inputRef}
        value={typed}
        onChange={(e) => status !== 'correct' && status !== 'reveal' && setTyped(e.target.value.slice(0, target.length))}
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
      <FeedbackBanner status={status} hint={item.hint} answer={target} />
    </div>
  )
}
