import { useEffect, useMemo, useRef, useState } from 'react'
import type { ItemResult } from '../types'
import { speak } from '../tts'
import { sfx } from '../sounds'
import { useLang } from '../i18n'
import { type ActivityProps, FeedbackBanner, ProgressDots, shuffle } from './shared'

interface Chip {
  id: number
  word: string
  punctuation?: boolean
}

export function Unscramble({ items, onAnswer, onFinish }: ActivityProps) {
  const { t } = useLang()
  const [index, setIndex] = useState(0)
  const [placed, setPlaced] = useState<Chip[]>([])
  const [status, setStatus] = useState<'idle' | 'wrong1' | 'reveal' | 'correct'>('idle')
  const [attempts, setAttempts] = useState(0)
  const [results, setResults] = useState<ItemResult[]>([])
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const item = items[index]
  const sentence = item?.sentence ?? ''

  // Words plus the final "?" / "!" as its own tappable chip
  const expected = useMemo<Chip[]>(() => {
    const punct = sentence.match(/[?!]$/)?.[0]
    const words = sentence.replace(/[.?!]$/, '').split(' ')
    const chips: Chip[] = words.map((word, id) => ({ id, word }))
    if (punct) chips.push({ id: words.length, word: punct, punctuation: true })
    return chips
  }, [sentence])

  const chips = useMemo(() => shuffle(expected), [expected])

  useEffect(() => {
    setPlaced([])
    setStatus('idle')
    setAttempts(0)
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current)
    }
  }, [index])

  if (!item) return null

  const available = chips.filter((c) => !placed.some((p) => p.id === c.id))

  const goNext = (newResults: ItemResult[]) => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
    if (index + 1 < items.length) setIndex(index + 1)
    else onFinish(newResults)
  }

  const check = () => {
    const ok = placed.length === expected.length && placed.every((c, i) => c.word === expected[i].word)
    if (ok) {
      setStatus('correct')
      speak(sentence)
      onAnswer(true)
      const newResults = [...results, { word_id: item.word_id, correct: attempts === 0 }]
      setResults(newResults)
      // Let the kid listen (and repeat it) before moving on
      advanceTimer.current = setTimeout(() => goNext(newResults), 6000)
    } else {
      onAnswer(false)
      if (attempts === 0) {
        setAttempts(1)
        setStatus('wrong1')
        setPlaced([])
      } else {
        setStatus('reveal')
        const newResults = [...results, { word_id: item.word_id, correct: false }]
        setResults(newResults)
        advanceTimer.current = setTimeout(() => goNext(newResults), 2500)
      }
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <ProgressDots total={items.length} current={index} />
      <p className="text-center font-bold text-ink-soft">{t.unscramble_help}</p>

      <div className="card-toy min-h-20 p-4 flex flex-wrap items-center justify-center gap-2">
        {placed.length === 0 && status !== 'reveal' && (
          <span className="text-sand-deep font-display font-bold text-lg">· · ·</span>
        )}
        {status === 'reveal' ? (
          <span className="font-display text-xl font-extrabold text-coral-deep">{sentence}</span>
        ) : (
          placed.map((chip) => (
            <button
              key={chip.id}
              onClick={() => status === 'idle' || status === 'wrong1' ? setPlaced(placed.filter((p) => p.id !== chip.id)) : undefined}
              className={`btn-chunky animate-pop px-3 py-2 text-lg ${
                chip.punctuation
                  ? 'bg-sun-pale border-sun text-sun-deep'
                  : 'bg-jungle-pale border-jungle text-jungle-deep'
              }`}
              style={{ borderWidth: '2px 2px 5px' }}
            >
              {chip.word}
            </button>
          ))
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {available.map((chip) => (
          <button
            key={chip.id}
            onClick={() => {
              if (status === 'correct' || status === 'reveal') return
              sfx.click()
              setPlaced([...placed, chip])
            }}
            className={`btn-chunky px-3 py-2 text-lg ${
              chip.punctuation
                ? 'bg-sun-pale border-sun text-sun-deep font-extrabold'
                : 'bg-white border-sand-deep text-ink'
            }`}
            style={{ borderWidth: '2px 2px 5px' }}
          >
            {chip.word}
          </button>
        ))}
      </div>

      {status === 'correct' ? (
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => speak(sentence)}
            className="btn-chunky bg-sky border-sky-deep text-white text-lg px-6 py-3"
          >
            🔊 {t.repeat_it}
          </button>
          <button
            onClick={() => goNext(results)}
            className="btn-chunky bg-jungle border-jungle-deep text-white text-lg px-6 py-3"
          >
            {t.continue} →
          </button>
        </div>
      ) : (
        <button
          onClick={check}
          disabled={available.length > 0 || status === 'reveal'}
          className="btn-chunky bg-sun border-sun-deep text-white text-xl px-8 py-3 mx-auto"
        >
          {t.check} ✓
        </button>
      )}
      {status === 'correct' && (
        <p className="text-center text-sm font-bold text-ink-soft animate-pop">🗣️ {t.say_it}</p>
      )}
      <FeedbackBanner status={status} hint={item.hint} answer={sentence} />
    </div>
  )
}
