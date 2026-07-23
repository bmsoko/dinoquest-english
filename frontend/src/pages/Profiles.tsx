import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useLang } from '../i18n'
import { ThemePicker } from '../components/ThemePicker'
import type { PlayerListItem, Theme } from '../types'

const AVATARS = ['🦖', '🦕', '🐉', '🦄', '🐯', '🦁', '🐸', '🦊', '🐼', '🐵', '🦅', '🐙']

export function Profiles() {
  const { t } = useLang()
  const navigate = useNavigate()
  const [players, setPlayers] = useState<PlayerListItem[]>([])
  const [themes, setThemes] = useState<Theme[]>([])
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[0])
  const [theme, setTheme] = useState('dinos')
  const [pin, setPin] = useState('')
  const [askPinFor, setAskPinFor] = useState<PlayerListItem | null>(null)
  const [pinTry, setPinTry] = useState('')
  const [pinError, setPinError] = useState(false)

  useEffect(() => {
    api.get('/players').then((r) => setPlayers(r.data))
    api.get('/player/themes').then((r) => setThemes(r.data))
  }, [])

  const enter = (id: number) => {
    localStorage.setItem('playerId', String(id))
    navigate('/')
  }

  const pick = (p: PlayerListItem) => {
    if (p.has_pin) {
      setAskPinFor(p)
      setPinTry('')
      setPinError(false)
    } else {
      enter(p.id)
    }
  }

  const tryPin = async () => {
    if (!askPinFor) return
    const res = await api.post(`/players/${askPinFor.id}/verify`, { pin: pinTry })
    if (res.data.ok) enter(askPinFor.id)
    else {
      setPinError(true)
      setPinTry('')
    }
  }

  const create = async () => {
    if (!name.trim()) return
    const res = await api.post('/players', { name: name.trim(), avatar, theme, pin })
    enter(res.data.id)
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center gap-8 p-6 pt-14">
      <h1 className="font-display text-4xl font-extrabold">{t.who_plays}</h1>

      <div className="stagger grid w-full grid-cols-2 gap-4 sm:grid-cols-3">
        {players.map((p) => (
          <button
            key={p.id}
            onClick={() => pick(p)}
            className="card-toy btn-chunky flex flex-col items-center gap-1 p-5 bg-white border-sand-deep"
            style={{ borderWidth: '3px 3px 8px' }}
          >
            <span className="text-6xl">{p.avatar}</span>
            <span className="font-display text-xl font-extrabold">
              {p.name} {p.has_pin && '🔒'}
            </span>
            <span className="text-xs font-bold text-ink-soft">
              {t.level} {p.level} · 🦖 {p.dino_count}
            </span>
          </button>
        ))}

        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="btn-chunky flex flex-col items-center justify-center gap-1 rounded-3xl p-5 bg-jungle-pale border-jungle text-jungle-deep"
            style={{ borderWidth: '3px 3px 8px', borderStyle: 'dashed dashed solid' }}
          >
            <span className="text-5xl">＋</span>
            <span className="font-display font-extrabold">{t.new_player}</span>
          </button>
        )}
      </div>

      {adding && (
        <div className="card-toy animate-pop w-full max-w-sm p-6 flex flex-col gap-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && create()}
            placeholder={t.player_name}
            maxLength={20}
            autoFocus
            className="w-full rounded-xl border-2 border-sand-deep px-4 py-3 font-display text-xl font-bold focus:border-jungle focus:outline-none"
          />
          <p className="font-bold text-sm text-ink-soft">{t.pick_avatar}</p>
          <div className="grid grid-cols-6 gap-2">
            {AVATARS.map((a) => (
              <button
                key={a}
                onClick={() => setAvatar(a)}
                className={`rounded-xl p-2 text-3xl transition-transform ${
                  avatar === a ? 'bg-jungle-pale ring-3 ring-jungle scale-110' : 'bg-sand'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
          <p className="font-bold text-sm text-ink-soft">{t.pick_theme}</p>
          <ThemePicker themes={themes} value={theme} onChange={setTheme} />
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder={`🔒 ${t.secret_pin}`}
            inputMode="numeric"
            className="w-full rounded-xl border-2 border-sand-deep px-4 py-2 font-display text-lg font-bold focus:border-jungle focus:outline-none"
          />
          <button
            onClick={create}
            disabled={!name.trim()}
            className="btn-chunky bg-jungle border-jungle-deep text-white text-xl px-8 py-3"
          >
            {t.create_player}
          </button>
        </div>
      )}

      {askPinFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-6" onClick={() => setAskPinFor(null)}>
          <div
            className={`card-toy animate-pop w-full max-w-xs p-6 text-center flex flex-col gap-4 ${pinError ? 'animate-shake' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-5xl">{askPinFor.avatar}</span>
            <h2 className="font-display text-xl font-extrabold">
              🔒 {t.enter_pin} {askPinFor.name}
            </h2>
            <input
              value={pinTry}
              onChange={(e) => { setPinTry(e.target.value.replace(/\D/g, '').slice(0, 6)); setPinError(false) }}
              onKeyDown={(e) => e.key === 'Enter' && tryPin()}
              inputMode="numeric"
              autoFocus
              className="w-full rounded-xl border-2 border-sand-deep px-4 py-3 text-center font-display text-3xl font-extrabold tracking-[0.5em] focus:border-jungle focus:outline-none"
            />
            {pinError && <p className="font-bold text-coral-deep">{t.wrong_pin}</p>}
            <button
              onClick={tryPin}
              disabled={!pinTry}
              className="btn-chunky bg-jungle border-jungle-deep text-white text-xl px-8 py-3"
            >
              {t.enter}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
