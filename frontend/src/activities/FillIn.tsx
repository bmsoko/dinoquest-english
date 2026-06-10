import { useEffect, useMemo, useState } from 'react'
import type { ItemResult } from '../types'
import { speak } from '../tts'
import { useLang } from '../i18n'
import { type ActivityProps, FeedbackBanner, ProgressDots, shuffle } from './shared'

export function FillIn({ items, onAnswer, onFinish }: ActivityProps) {
  const { t } = useLang()
  const [index, setIndex] = useState(0)
  const [status, setStatus] = useState<'idle' | 'wrong1' | 'reveal' | 'correct'>('idle')
  const [picked, setPicked] = useState<string | null>(null)
  const [wrongPicks, setWrongPicks] = useState<string[]>([])
  const [results, setResults] = useState<ItemResult[]>([])

  const item = items[index]
  const options = useMemo(() => shuffle(item?.options ?? []), [item])
  const sentence = item?.sentence ?? ''

  useEffect(() => {
    setStatus('idle')
    setPicked(null)
    setWrongPicks([])
  }, [index])

  if (!item) return null

  const advance = (correct: boolean) => {
    const newResults = [...results, { word_id: item.word_id, correct }]
    setResults(newResults)
    setTimeout(() => {
      if (index + 1 < items.length) setIndex(index + 1)
      else onFinish(newResults)
    }, 1500)
  }

  const pick = (option: string) => {
    if (status === 'correct' || status === 'reveal') return
    setPicked(option)
    if (option === item.answer) {
      setStatus('correct')
      speak(sentence.replace('___', item.answer!))
      onAnswer(true)
      advance(wrongPicks.length === 0)
    } else {
      onAnswer(false)
      if (wrongPicks.length === 0) {
        setWrongPicks([option])
        setStatus('wrong1')
      } else {
        setWrongPicks([...wrongPicks, option])
        setStatus('reveal')
        setPicked(item.answer!)
        advance(false)
      }
    }
  }

  const shown = status === 'correct' || status === 'reveal' ? item.answer : picked && !wrongPicks.includes(picked) ? picked : null

  return (
    <div className="flex flex-col gap-5">
      <ProgressDots total={items.length} current={index} />
      <p className="text-center font-bold text-ink-soft">{t.fill_in_help}</p>

      <div className="card-toy p-6 text-center font-display text-2xl font-bold leading-relaxed">
        {sentence.split('___').map((part, i, arr) => (
          <span key={i}>
            {part}
            {i < arr.length - 1 && (
              <span
                className={`mx-1 inline-block min-w-20 rounded-xl border-b-4 px-2 ${
                  status === 'correct'
                    ? 'border-jungle bg-jungle-pale text-jungle-deep'
                    : status === 'reveal'
                      ? 'border-coral bg-coral-pale text-coral-deep'
                      : 'border-sun bg-sun-pale text-sun-deep'
                }`}
              >
                {shown ?? ' '}
              </span>
            )}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => {
          const isWrong = wrongPicks.includes(option)
          return (
            <button
              key={option}
              onClick={() => pick(option)}
              disabled={isWrong}
              className={`btn-chunky px-4 py-4 text-xl ${
                isWrong
                  ? 'bg-coral-pale border-coral text-coral-deep opacity-60 animate-shake'
                  : 'bg-white border-sand-deep text-ink'
              }`}
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
