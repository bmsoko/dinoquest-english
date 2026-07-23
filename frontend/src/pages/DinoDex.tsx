import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useLang } from '../i18n'
import type { PlayerState, Species } from '../types'

const RARITY_COLORS: Record<string, string> = {
  common: '#9fb8aa',
  rare: '#4aa3df',
  epic: '#9b6ddb',
  legendary: '#f5a623',
}

export function DinoDex() {
  const { t, lang } = useLang()
  const [player, setPlayer] = useState<PlayerState | null>(null)
  const [species, setSpecies] = useState<Species[]>([])

  const load = async () => {
    const [p, s] = await Promise.all([api.get('/player'), api.get('/player/species')])
    setPlayer(p.data)
    setSpecies(s.data)
  }

  useEffect(() => {
    load()
  }, [])

  const setCompanion = async (dinoId: number) => {
    await api.post('/player/companion', { dino_id: dinoId })
    load()
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl p-4">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="btn-chunky bg-white border-sand-deep px-3 py-1.5 text-lg" style={{ borderWidth: '2px 2px 5px' }}>
          ←
        </Link>
        <h1 className="font-display text-3xl font-extrabold">
          {player ? `${player.theme_emoji} ${lang === 'es' ? player.collection_es : player.collection_en}` : `📖 ${t.dinodex}`}
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {species.map((sp) => {
          const owned = player?.dinos.filter((d) => d.species_id === sp.id) ?? []
          const best = owned.sort((a, b) => b.stage - a.stage)[0]
          const isCompanion = owned.some((d) => d.id === player?.companion_id)
          return (
            <div
              key={sp.id}
              className={`card-toy p-4 text-center ${best ? '' : 'opacity-60'}`}
              style={isCompanion ? { borderColor: sp.color, borderWidth: 3 } : undefined}
            >
              <div
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-5xl"
                style={{
                  backgroundColor: best ? sp.color + '33' : '#e8e0cc',
                  border: `3px solid ${best ? sp.color : '#d8cdb0'}`,
                  filter: best ? 'none' : 'grayscale(1) contrast(0.3)',
                }}
              >
                {best ? sp.stages[best.stage - 1].emoji : '❔'}
              </div>
              <p className="mt-2 font-display font-extrabold leading-tight">
                {best ? sp.stages[best.stage - 1].name : t.undiscovered}
              </p>
              <span
                className="mt-1 inline-block rounded-full px-3 py-0.5 font-display text-xs font-extrabold text-white"
                style={{ backgroundColor: RARITY_COLORS[sp.rarity] }}
              >
                {t.rarity[sp.rarity as keyof typeof t.rarity] ?? sp.rarity}
              </span>
              {best && (
                <>
                  <p className="mt-1 text-xs font-bold text-ink-soft">
                    {t.stage} {best.stage}/3 · {best.xp} XP
                  </p>
                  {isCompanion ? (
                    <p className="mt-1 font-display text-xs font-extrabold" style={{ color: sp.color }}>
                      ⭐ {t.companion}
                    </p>
                  ) : (
                    <button
                      onClick={() => setCompanion(best.id)}
                      className="btn-chunky mt-2 bg-white border-sand-deep px-3 py-1 text-xs font-bold"
                      style={{ borderWidth: '2px 2px 4px' }}
                    >
                      {t.companion_pick}
                    </button>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
