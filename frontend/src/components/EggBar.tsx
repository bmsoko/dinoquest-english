import { useLang } from '../i18n'

export function EggBar({ progress }: { progress: number }) {
  const { t } = useLang()
  const pct = Math.min(100, progress)
  return (
    <div className="flex items-center gap-2 w-full">
      <span className={`text-2xl ${pct >= 80 ? 'animate-crack inline-block' : ''}`}>🥚</span>
      <div className="h-3 flex-1 overflow-hidden rounded-full border-2 border-sand-deep bg-white">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sun to-coral transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-display text-xs font-bold text-ink-soft whitespace-nowrap">
        {pct >= 80 ? t.egg_almost : `${t.egg_progress} ${pct}%`}
      </span>
    </div>
  )
}
