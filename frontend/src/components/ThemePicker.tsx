import type { Theme } from '../types'
import { useLang } from '../i18n'

/** Prize-set chooser. Shared by profile creation and the in-app change modal. */
export function ThemePicker({
  themes,
  value,
  onChange,
}: {
  themes: Theme[]
  value: string
  onChange: (id: string) => void
}) {
  const { lang } = useLang()
  return (
    <div className="stagger grid grid-cols-3 gap-2">
      {themes.map((th) => (
        <button
          key={th.id}
          onClick={() => onChange(th.id)}
          className={`flex flex-col items-center gap-0.5 rounded-2xl p-3 transition-transform ${
            value === th.id
              ? 'bg-jungle-pale ring-3 ring-jungle scale-105'
              : 'bg-sand hover:scale-105'
          }`}
        >
          <span className="text-3xl">{th.emoji}</span>
          <span className="font-display text-xs font-extrabold leading-tight">
            {lang === 'es' ? th.name_es : th.name_en}
          </span>
        </button>
      ))}
    </div>
  )
}
