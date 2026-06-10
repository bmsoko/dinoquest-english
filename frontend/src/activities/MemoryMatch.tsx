import { useMemo, useState } from 'react'
import { speak } from '../tts'
import { useLang } from '../i18n'
import { type ActivityProps, ProgressDots, shuffle } from './shared'

interface Card {
  key: string
  word_id: number | null
  face: string
  matchKey: string
  kind: 'word' | 'emoji'
}

export function MemoryMatch({ items, onAnswer, onFinish }: ActivityProps) {
  const { t } = useLang()
  const cards = useMemo<Card[]>(() => {
    const pairs = items.flatMap((item) => [
      { key: `w-${item.word_id}`, word_id: item.word_id, face: item.text ?? '', matchKey: String(item.word_id), kind: 'word' as const },
      { key: `e-${item.word_id}`, word_id: item.word_id, face: item.emoji ?? '❓', matchKey: String(item.word_id), kind: 'emoji' as const },
    ])
    return shuffle(pairs)
  }, [items])

  const [flipped, setFlipped] = useState<string[]>([])
  const [matched, setMatched] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  const flip = (card: Card) => {
    if (busy || flipped.includes(card.key) || matched.includes(card.matchKey)) return
    if (card.kind === 'word') speak(card.face)
    const next = [...flipped, card.key]
    setFlipped(next)
    if (next.length === 2) {
      const [a, b] = next.map((k) => cards.find((c) => c.key === k)!)
      if (a.matchKey === b.matchKey) {
        const newMatched = [...matched, a.matchKey]
        setMatched(newMatched)
        setFlipped([])
        onAnswer(true)
        if (newMatched.length === items.length) {
          // Memory is the low-stress activity: every completed pair counts as correct
          setTimeout(() => onFinish(items.map((i) => ({ word_id: i.word_id, correct: true }))), 900)
        }
      } else {
        setBusy(true)
        onAnswer(false)
        setTimeout(() => {
          setFlipped([])
          setBusy(false)
        }, 900)
      }
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <ProgressDots total={items.length} current={matched.length} />
      <p className="text-center font-bold text-ink-soft">{t.memory_help}</p>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {cards.map((card) => {
          const isUp = flipped.includes(card.key) || matched.includes(card.matchKey)
          const isMatched = matched.includes(card.matchKey)
          return (
            <button
              key={card.key}
              onClick={() => flip(card)}
              className={`btn-chunky flex h-20 items-center justify-center px-1 transition-all duration-300 ${
                isMatched
                  ? 'bg-jungle-pale border-jungle text-jungle-deep scale-95'
                  : isUp
                    ? 'bg-white border-sky text-ink animate-pop'
                    : 'bg-sun border-sun-deep text-white'
              }`}
              style={{ borderWidth: '2px 2px 6px' }}
            >
              {isUp ? (
                <span className={card.kind === 'emoji' ? 'text-3xl' : 'font-display text-sm font-extrabold leading-tight'}>
                  {card.face}
                </span>
              ) : (
                <span className="text-2xl">🌿</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
