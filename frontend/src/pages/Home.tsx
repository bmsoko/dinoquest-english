import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useLang } from '../i18n'
import type { PlayerState } from '../types'
import { EggBar } from '../components/EggBar'

export function Home() {
  const { t, lang, toggle } = useLang()
  const [player, setPlayer] = useState<PlayerState | null>(null)

  useEffect(() => {
    api.get('/player').then((r) => setPlayer(r.data))
  }, [])

  const companion = player?.dinos.find((d) => d.id === player.companion_id)

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center gap-6 p-6 pt-10">
      <button
        onClick={toggle}
        className="absolute right-4 top-4 btn-chunky bg-white border-sand-deep px-3 py-1 text-sm font-bold"
        style={{ borderWidth: '2px 2px 5px' }}
      >
        {lang === 'es' ? '🇪🇸 ES' : '🇬🇧 EN'}
      </button>

      <div className="text-center">
        <div className="text-7xl animate-bounce-big inline-block">{companion?.emoji ?? '🦖'}</div>
        <h1 className="mt-2 font-display text-5xl font-extrabold tracking-tight">
          Dino<span className="text-jungle">Quest</span>
        </h1>
        <p className="font-bold text-ink-soft">{t.home_subtitle}</p>
      </div>

      {player && (
        <div className="card-toy w-full p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-display text-xl font-extrabold text-jungle-deep">
              {t.level} {player.level}
            </span>
            <span className="font-display text-lg font-extrabold text-sun-deep">
              🔥 {player.streak} {t.streak_days}
            </span>
          </div>
          <div className="h-4 w-full overflow-hidden rounded-full border-2 border-sand-deep bg-sand">
            <div
              className="h-full rounded-full bg-gradient-to-r from-jungle to-sun transition-all duration-700"
              style={{ width: `${Math.min(100, (player.level_progress / player.level_needed) * 100)}%` }}
            />
          </div>
          <EggBar progress={player.egg_progress} />
        </div>
      )}

      <Link
        to="/play"
        className="btn-chunky bg-jungle border-jungle-deep text-white text-4xl px-16 py-6 text-center w-full max-w-xs"
      >
        ▶ {t.play}
      </Link>

      <div className="flex gap-4">
        <Link
          to="/dinodex"
          className="btn-chunky bg-berry border-berry-deep text-white text-xl px-8 py-3"
        >
          📖 {t.dinodex}
        </Link>
      </div>

      <Link to="/parents" className="mt-auto text-sm font-bold text-ink-soft underline opacity-60">
        ⚙️ {t.parent_zone}
      </Link>
    </div>
  )
}
