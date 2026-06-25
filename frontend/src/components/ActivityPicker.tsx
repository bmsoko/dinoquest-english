import type { ActivityType } from '../types'
import { useLang } from '../i18n'
import { SEGMENTS, activityLabel } from './Wheel'

/** Direct activity buttons — practice one type without the wheel. */
export function ActivityPicker({ onPick }: { onPick: (type: ActivityType) => void }) {
  const { t } = useLang()
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="font-display font-bold text-ink-soft">{t.or_pick}</p>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {SEGMENTS.map((s) => (
          <button
            key={s.type}
            onClick={() => onPick(s.type)}
            className="btn-chunky flex items-center gap-2 bg-white border-sand-deep px-4 py-2.5 text-base text-ink"
            style={{ borderWidth: '2px 2px 5px', borderColor: s.color }}
          >
            <span className="text-xl">{s.emoji}</span>
            {activityLabel(s.type, t)}
          </button>
        ))}
      </div>
    </div>
  )
}
