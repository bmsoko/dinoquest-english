import { useEffect, useState } from 'react'
import confetti from 'canvas-confetti'
import type { GameEvent, Species } from '../types'
import { sfx } from '../sounds'
import { useLang } from '../i18n'

const RARITY_COLORS: Record<string, string> = {
  common: '#9fb8aa',
  rare: '#4aa3df',
  epic: '#9b6ddb',
  legendary: '#f5a623',
}

export function RewardOverlay({
  events,
  species,
  onDone,
}: {
  events: GameEvent[]
  species: Species[]
  onDone: () => void
}) {
  const { t } = useLang()
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const event = events[index]

  useEffect(() => {
    setRevealed(false)
    if (!event) return
    if (event.type === 'level_up') {
      sfx.levelUp()
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } })
    }
    if (event.type === 'dino_evolved') {
      sfx.evolve()
    }
  }, [index, event])

  if (!event) return null

  const next = () => {
    if (index + 1 < events.length) setIndex(index + 1)
    else onDone()
  }

  const sp = event.dino ? species.find((s) => s.id === event.dino!.species_id) : undefined

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-6" onClick={() => revealed || event.type !== 'egg_hatched' ? undefined : null}>
      <div className="card-toy animate-pop w-full max-w-sm p-8 text-center">
        {event.type === 'level_up' && (
          <>
            <div className="text-6xl mb-3">🏆</div>
            <h2 className="font-display text-3xl font-extrabold text-sun-deep">{t.level_up}</h2>
            <p className="mt-1 font-display text-5xl font-extrabold text-jungle">{event.level}</p>
            <button onClick={next} className="btn-chunky mt-6 bg-jungle border-jungle-deep text-white text-xl px-8 py-3 w-full">
              {t.continue}
            </button>
          </>
        )}
        {event.type === 'egg_hatched' && !revealed && (
          <>
            <h2 className="font-display text-2xl font-extrabold">{t.egg_hatched}</h2>
            <button onClick={() => { setRevealed(true); sfx.hatch(); confetti({ particleCount: 160, spread: 120, origin: { y: 0.5 } }) }} className="mt-4 text-8xl animate-crack inline-block cursor-pointer bg-transparent border-none">
              🥚
            </button>
            <p className="mt-2 font-bold text-ink-soft">{t.tap_to_open}</p>
          </>
        )}
        {event.type === 'egg_hatched' && revealed && sp && (
          <>
            <h2 className="font-display text-2xl font-extrabold">{t.new_dino}</h2>
            <div
              className="mx-auto mt-4 flex h-32 w-32 animate-pop items-center justify-center rounded-full text-7xl"
              style={{ backgroundColor: sp.color + '33', border: `4px solid ${sp.color}` }}
            >
              {sp.stages[0].emoji}
            </div>
            <p className="mt-3 font-display text-2xl font-extrabold">{sp.stages[0].name}</p>
            <span
              className="mt-1 inline-block rounded-full px-4 py-1 font-display text-sm font-extrabold text-white"
              style={{ backgroundColor: RARITY_COLORS[sp.rarity] ?? '#9fb8aa' }}
            >
              {t.rarity[sp.rarity as keyof typeof t.rarity] ?? sp.rarity}
            </span>
            <button onClick={next} className="btn-chunky mt-6 bg-jungle border-jungle-deep text-white text-xl px-8 py-3 w-full">
              {t.continue}
            </button>
          </>
        )}
        {event.type === 'dino_evolved' && (
          <>
            <div className="text-6xl mb-3 animate-bounce-big">✨</div>
            <h2 className="font-display text-2xl font-extrabold text-berry-deep">
              {event.name} {t.evolved}
            </h2>
            <p className="mt-1 font-bold text-ink-soft">{t.stage} {event.stage}</p>
            <button onClick={next} className="btn-chunky mt-6 bg-berry border-berry-deep text-white text-xl px-8 py-3 w-full">
              {t.continue}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
