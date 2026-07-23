import { useEffect, useMemo, useRef, useState } from 'react'
import type { ItemResult } from '../types'
import { speak } from '../tts'
import { sfx } from '../sounds'
import { useLang } from '../i18n'
import { WordIcon } from '../components/CalendarIcon'
import { type ActivityProps, FeedbackBanner, ListenButtons, ProgressDots, shuffle } from './shared'

interface Tile {
  id: number
  letter: string
}

/** Anagram: rebuild a single word from its jumbled letters. */
export function Anagram({ items, onAnswer, onFinish }: ActivityProps) {
  const { t } = useLang()
  const [index, setIndex] = useState(0)
  const [placed, setPlaced] = useState<Tile[]>([])
  const [status, setStatus] = useState<'idle' | 'wrong1' | 'reveal' | 'correct'>('idle')
  const [attempts, setAttempts] = useState(0)
  const [results, setResults] = useState<ItemResult[]>([])
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const item = items[index]
  const answer = (item?.answer ?? '').trim()
  const letters = useMemo(() => answer.replace(/\s/g, '').split(''), [answer])
  const tiles = useMemo(
    () => shuffle(letters.map((letter, id) => ({ id, letter }))),
    [letters],
  )

  useEffect(() => {
    setPlaced([])
    setStatus('idle')
    setAttempts(0)
    if (answer) speak(answer)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [index, answer])

  if (!item) return null

  const available = tiles.filter((tile) => !placed.some((p) => p.id === tile.id))

  const advance = (correct: boolean) => {
    const next = [...results, { word_id: item.word_id, correct }]
    setResults(next)
    timer.current = setTimeout(() => {
      if (index + 1 < items.length) setIndex(index + 1)
      else onFinish(next)
    }, 1500)
  }

  const check = () => {
    if (status === 'correct' || status === 'reveal') return
    const built = placed.map((p) => p.letter).join('')
    if (built.toLowerCase() === letters.join('').toLowerCase()) {
      setStatus('correct')
      speak(answer)
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
      <p className="text-center font-bold text-ink-soft">{t.anagram_help}</p>
      <div className="text-center">
        <WordIcon word={answer} emoji={item.emoji} fallback="🔤" />
      </div>
      <ListenButtons text={answer} />

      {/* Answer slots */}
      <div className="card-toy min-h-16 p-3 flex flex-wrap items-center justify-center gap-1.5">
        {status === 'reveal' ? (
          <span className="font-display text-2xl font-extrabold text-coral-deep">{answer}</span>
        ) : placed.length === 0 ? (
          <span className="font-display font-bold text-sand-deep text-lg">· · ·</span>
        ) : (
          placed.map((tile) => (
            <button
              key={tile.id}
              onClick={() =>
                (status === 'idle' || status === 'wrong1') &&
                setPlaced(placed.filter((p) => p.id !== tile.id))
              }
              className="btn-chunky animate-pop flex h-12 w-9 items-center justify-center bg-jungle-pale border-jungle text-jungle-deep font-display text-2xl font-extrabold"
              style={{ borderWidth: '2px 2px 5px' }}
            >
              {tile.letter}
            </button>
          ))
        )}
      </div>

      {/* Letter bank */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {available.map((tile) => (
          <button
            key={tile.id}
            onClick={() => {
              if (status === 'correct' || status === 'reveal') return
              sfx.click()
              setPlaced([...placed, tile])
            }}
            className="btn-chunky flex h-12 w-9 items-center justify-center bg-white border-sand-deep text-ink font-display text-2xl font-extrabold"
            style={{ borderWidth: '2px 2px 5px' }}
          >
            {tile.letter}
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
      <FeedbackBanner status={status} hint={item.hint} answer={answer} />
    </div>
  )
}
