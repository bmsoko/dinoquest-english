import { useEffect, useMemo, useState } from 'react'
import type { ItemResult } from '../types'
import { speak } from '../tts'
import { useLang } from '../i18n'
import { type ActivityProps, FeedbackBanner, ProgressDots, normalize, shuffle } from './shared'

interface Chip {
  id: number
  word: string
}

export function Unscramble({ items, onAnswer, onFinish }: ActivityProps) {
  const { t } = useLang()
  const [index, setIndex] = useState(0)
  const [placed, setPlaced] = useState<Chip[]>([])
  const [status, setStatus] = useState<'idle' | 'wrong1' | 'reveal' | 'correct'>('idle')
  const [attempts, setAttempts] = useState(0)
  const [results, setResults] = useState<ItemResult[]>([])

  const item = items[index]
  const sentence = item?.sentence ?? ''
  const chips = useMemo<Chip[]>(() => {
    const words = sentence.replace(/[.?!]$/, '').split(' ')
    return shuffle(words.map((word, id) => ({ id, word })))
  }, [sentence])

  useEffect(() => {
    setPlaced([])
    setStatus('idle')
    setAttempts(0)
  }, [index])

  if (!item) return null

  const available = chips.filter((c) => !placed.some((p) => p.id === c.id))

  const advance = (correct: boolean) => {
    const newResults = [...results, { word_id: item.word_id, correct }]
    setResults(newResults)
    setTimeout(() => {
      if (index + 1 < items.length) setIndex(index + 1)
      else onFinish(newResults)
    }, 1500)
  }

  const check = () => {
    const built = placed.map((c) => c.word).join(' ')
    if (normalize(built) === normalize(sentence)) {
      setStatus('correct')
      speak(sentence)
      onAnswer(true)
      advance(attempts === 0)
    } else {
      onAnswer(false)
      if (attempts === 0) {
        setAttempts(1)
        setStatus('wrong1')
        setPlaced([])
      } else {
        setStatus('reveal')
        advance(false)
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
              onClick={() => setPlaced(placed.filter((p) => p.id !== chip.id))}
              className="btn-chunky animate-pop bg-jungle-pale border-jungle text-jungle-deep px-3 py-2 text-lg"
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
            onClick={() => status !== 'correct' && status !== 'reveal' && setPlaced([...placed, chip])}
            className="btn-chunky bg-white border-sand-deep text-ink px-3 py-2 text-lg"
            style={{ borderWidth: '2px 2px 5px' }}
          >
            {chip.word}
          </button>
        ))}
      </div>

      <button
        onClick={check}
        disabled={available.length > 0 || status === 'correct' || status === 'reveal'}
        className="btn-chunky bg-sun border-sun-deep text-white text-xl px-8 py-3 mx-auto"
      >
        {t.check} ✓
      </button>
      <FeedbackBanner status={status} hint={item.hint} answer={sentence} />
    </div>
  )
}
