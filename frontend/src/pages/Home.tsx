import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useLang } from '../i18n'
import type { ExamStatus, PlayerListItem, PlayerState } from '../types'
import { EggBar } from '../components/EggBar'

export function Home() {
  const { t, lang, toggle } = useLang()
  const navigate = useNavigate()
  const [player, setPlayer] = useState<PlayerState | null>(null)
  const [exam, setExam] = useState<ExamStatus | null>(null)
  const [players, setPlayers] = useState<PlayerListItem[]>([])

  useEffect(() => {
    if (!localStorage.getItem('playerId')) {
      navigate('/profiles')
      return
    }
    api
      .get('/player')
      .then((r) => setPlayer(r.data))
      .catch(() => {
        // Stale player id (deleted player) — back to the picker
        localStorage.removeItem('playerId')
        navigate('/profiles')
      })
    api.get('/play/exam').then((r) => setExam(r.data))
    api.get('/players').then((r) => setPlayers(r.data))
  }, [navigate])

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

      {player && (
        <Link
          to="/profiles"
          className="absolute left-4 top-4 btn-chunky flex items-center gap-2 bg-white border-sand-deep px-3 py-1"
          style={{ borderWidth: '2px 2px 5px' }}
          title={t.change_player}
        >
          <span className="text-2xl">{player.avatar}</span>
          <span className="font-display font-extrabold">{player.name}</span>
        </Link>
      )}

      <div className="text-center">
        <div className="text-7xl animate-bounce-big inline-block">{companion?.emoji ?? '🦖'}</div>
        <h1 className="mt-2 font-display text-5xl font-extrabold tracking-tight">
          Dino<span className="text-jungle">Quest</span>
        </h1>
        <p className="font-bold text-ink-soft">{t.home_subtitle}</p>
      </div>

      {player && (
        <div className="card-toy w-full p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-display text-xl font-extrabold text-jungle-deep">
              {t.level} {player.level}
            </span>
            <span className="rounded-xl bg-sky/15 border-2 border-sky px-2.5 py-0.5 font-display text-sm font-extrabold text-sky-deep">
              ⚡ {t.this_week}: {player.weekly_xp} XP
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

      {exam?.exists && (
        <Link
          to="/play?mode=exam"
          className="btn-chunky bg-coral border-coral-deep text-white text-center w-full max-w-xs px-8 py-4"
        >
          <span className="text-2xl">🎯 {t.exam_prep}</span>
          <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-white/30">
            <div
              className="h-full rounded-full bg-white transition-all duration-700"
              style={{
                width: `${exam.words_total ? Math.round(((exam.words_mastered ?? 0) / exam.words_total) * 100) : 0}%`,
              }}
            />
          </div>
          <span className="text-xs font-bold opacity-90">
            {exam.words_mastered}/{exam.words_total} {t.exam_words}
          </span>
        </Link>
      )}

      <div className="flex gap-4">
        <Link
          to="/dinodex"
          className="btn-chunky bg-berry border-berry-deep text-white text-xl px-8 py-3"
        >
          📖 {t.dinodex}
        </Link>
      </div>

      {players.length > 1 && (
        <div className="card-toy w-full p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-lg font-extrabold">🏆 {t.weekly_board}</h2>
            <span className="text-xs font-bold text-ink-soft">{t.weekly_hint}</span>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {[...players]
              .sort((a, b) => b.weekly_xp - a.weekly_xp)
              .map((p, i) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
                    p.id === player?.id ? 'bg-jungle-pale' : 'bg-sand'
                  }`}
                >
                  <span className="font-display text-lg font-extrabold w-6">
                    {i === 0 ? '👑' : `${i + 1}.`}
                  </span>
                  <span className="text-2xl">{p.avatar}</span>
                  <span className="font-display font-extrabold flex-1">{p.name}</span>
                  <span className="font-display font-extrabold text-sky-deep">
                    {p.weekly_xp} XP
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      <Link to="/parents" className="mt-auto text-sm font-bold text-ink-soft underline opacity-60">
        ⚙️ {t.parent_zone}
      </Link>
    </div>
  )
}
