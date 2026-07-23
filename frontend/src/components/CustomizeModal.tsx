import { useState } from 'react'
import { api } from '../api'
import { useLang } from '../i18n'
import { AVATAR_GROUPS } from '../avatars'
import { ThemePicker } from './ThemePicker'
import type { PlayerState, Theme } from '../types'

/** Kid-facing profile customization: avatar + which prize set they collect. */
export function CustomizeModal({
  player,
  themes,
  playerId,
  onClose,
  onSaved,
}: {
  player: PlayerState
  themes: Theme[]
  /** Edit a profile other than the active one (profile picker). */
  playerId?: number
  onClose: () => void
  onSaved: () => void
}) {
  const { t, lang } = useLang()
  const [avatar, setAvatar] = useState(player.avatar)
  const [theme, setTheme] = useState(player.theme)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await api.post(
        '/player/profile',
        { avatar, theme },
        playerId ? { headers: { 'X-Player-Id': String(playerId) } } : undefined,
      )
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4" onClick={onClose}>
      <div
        className="card-toy animate-pop flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b-2 border-sand-deep px-5 py-3">
          <span className="text-4xl">{avatar}</span>
          <h2 className="font-display text-xl font-extrabold">✨ {t.customize}</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="mb-2 font-bold text-sm text-ink-soft">{t.pick_avatar}</p>
          {AVATAR_GROUPS.map((group) => (
            <div key={group.id} className="mb-3">
              <p className="mb-1 font-display text-xs font-extrabold uppercase tracking-wide text-ink-soft/70">
                {lang === 'es' ? group.label_es : group.label_en}
              </p>
              <div className="grid grid-cols-7 gap-1.5">
                {group.emojis.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAvatar(a)}
                    className={`rounded-xl p-1.5 text-2xl transition-transform ${
                      avatar === a ? 'bg-jungle-pale ring-3 ring-jungle scale-110' : 'bg-sand'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <p className="mb-2 mt-4 font-bold text-sm text-ink-soft">🎁 {t.pick_theme}</p>
          <ThemePicker themes={themes} value={theme} onChange={setTheme} />
          <p className="mt-2 text-xs font-bold text-ink-soft">{t.change_prizes_note}</p>
        </div>

        <div className="flex gap-2 border-t-2 border-sand-deep px-5 py-3">
          <button
            onClick={onClose}
            className="btn-chunky flex-1 bg-white border-sand-deep text-ink text-base"
            style={{ borderWidth: '2px 2px 5px' }}
          >
            {t.cancel}
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="btn-chunky flex-1 bg-jungle border-jungle-deep text-white text-base"
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  )
}
