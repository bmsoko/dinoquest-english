import type { PlayerSummary } from '../types'
import { useLang } from '../i18n'

export function TopBar({ player, combo }: { player: PlayerSummary | null; combo: number }) {
  const { t } = useLang()
  if (!player) return null
  const pct = Math.min(100, Math.round((player.level_progress / player.level_needed) * 100))
  const multiplier = combo >= 9 ? 4 : combo >= 6 ? 3 : combo >= 3 ? 2 : 1

  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex items-center gap-1 rounded-2xl bg-jungle-pale border-2 border-jungle px-3 py-1 font-display font-extrabold text-jungle-deep text-sm whitespace-nowrap">
        {t.level} {player.level}
      </div>
      <div className="relative h-5 flex-1 overflow-hidden rounded-full border-2 border-sand-deep bg-white">
        <div
          className="h-full rounded-full bg-gradient-to-r from-jungle to-sun transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
        <span className="absolute inset-0 flex items-center justify-center font-display text-[10px] font-bold text-ink-soft">
          {player.level_progress}/{player.level_needed} XP
        </span>
      </div>
      <div className="flex items-center gap-1 rounded-2xl bg-sun-pale border-2 border-sun px-2.5 py-1 font-display font-extrabold text-sun-deep text-sm whitespace-nowrap">
        🔥 {player.streak}
      </div>
      {multiplier > 1 && (
        <div
          key={multiplier}
          className="animate-pop rounded-2xl bg-coral-pale border-2 border-coral px-2.5 py-1 font-display font-extrabold text-coral-deep text-sm whitespace-nowrap"
        >
          x{multiplier} 🌟
        </div>
      )}
    </div>
  )
}
