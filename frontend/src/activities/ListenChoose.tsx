import { useEffect, useMemo, useState } from 'react'
import type { ItemResult } from '../types'
import { speak } from '../tts'
import { useLang } from '../i18n'
import { WordIcon } from '../components/CalendarIcon'
import { type ActivityProps, FeedbackBanner, ListenButtons, ProgressDots, shuffle } from './shared'

export function ListenChoose({ items, onAnswer, onFinish }: ActivityProps) {
  const { t } = useLang()
  const [index, setIndex] = useState(0)
  const [status, setStatus] = useState<'idle' | 'wrong1' | 'reveal' | 'correct'>('idle')
  const [wrongPicks, setWrongPicks] = useState<string[]>([])
  const [results, setResults] = useState<ItemResult[]>([])

  const item = items[index]
  const options = useMemo(() => shuffle(item?.options ?? []), [item])

  useEffect(() => {
    if (item?.answer) speak(item.answer)
    setStatus('idle')
    setWrongPicks([])
  }, [index, item])

  if (!item) return null

  const advance = (correct: boolean) => {
    const newResults = [...results, { word_id: item.word_id, correct }]
    setResults(newResults)
    setTimeout(() => {
      if (index + 1 < items.length) setIndex(index + 1)
      else onFinish(newResults)
    }, 1100)
  }

  const pick = (option: string) => {
    if (status === 'correct' || status === 'reveal') return
    if (option === item.answer) {
      setStatus('correct')
      onAnswer(true)
      advance(wrongPicks.length === 0)
    } else {
      onAnswer(false)
      if (wrongPicks.length === 0) {
        setWrongPicks([option])
        setStatus('wrong1')
        speak(item.answer!)
      } else {
        setWrongPicks([...wrongPicks, option])
        setStatus('reveal')
        advance(false)
      }
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <ProgressDots total={items.length} current={index} />
      <p className="text-center font-bold text-ink-soft">{t.listen_choose_help}</p>
      <div className="text-center">
        <WordIcon word={item.answer} emoji={item.emoji} fallback="👂" />
      </div>
      <ListenButtons text={item.answer ?? ''} />
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => {
          const isWrong = wrongPicks.includes(option)
          const isAnswer = option === item.answer
          const highlight =
            (status === 'correct' || status === 'reveal') && isAnswer
              ? 'bg-jungle-pale border-jungle text-jungle-deep'
              : isWrong
                ? 'bg-coral-pale border-coral text-coral-deep opacity-60'
                : 'bg-white border-sand-deep text-ink'
          return (
            <button
              key={option}
              onClick={() => pick(option)}
              disabled={isWrong}
              className={`btn-chunky px-4 py-5 text-xl ${highlight} ${isWrong ? 'animate-shake' : ''}`}
              style={{ borderWidth: '2px 2px 6px' }}
            >
              {option}
            </button>
          )
        })}
      </div>
      <FeedbackBanner status={status} hint={item.hint} answer={item.answer} />
    </div>
  )
}
