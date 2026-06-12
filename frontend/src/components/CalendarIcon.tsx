const DAY_ABBR: Record<string, string> = {
  monday: 'MON',
  tuesday: 'TUE',
  wednesday: 'WED',
  thursday: 'THU',
  friday: 'FRI',
  saturday: 'SAT',
  sunday: 'SUN',
}

export function weekdayAbbr(text?: string | null): string | null {
  if (!text) return null
  return DAY_ABBR[text.trim().toLowerCase()] ?? null
}

/** Flip-calendar icon like the Power Up book uses for days of the week. */
export function CalendarIcon({ abbr, size = 72 }: { abbr: string; size?: number }) {
  return (
    <span
      className="relative inline-flex flex-col overflow-visible select-none"
      style={{ width: size, height: size * 1.08 }}
    >
      {/* binder rings */}
      <span
        className="absolute left-1/2 z-10 flex justify-between"
        style={{ width: size * 0.5, transform: 'translateX(-50%)', top: -size * 0.07 }}
      >
        <span
          className="rounded-full border-2 border-ink-soft bg-sand"
          style={{ width: size * 0.13, height: size * 0.2 }}
        />
        <span
          className="rounded-full border-2 border-ink-soft bg-sand"
          style={{ width: size * 0.13, height: size * 0.2 }}
        />
      </span>
      <span
        className="flex h-full w-full flex-col overflow-hidden rounded-xl border-2 border-coral-deep bg-white shadow-[0_3px_0_rgba(193,77,44,0.4)]"
      >
        <span className="bg-coral" style={{ height: size * 0.24 }} />
        <span className="flex flex-1 items-center justify-center">
          <span
            className="font-display font-extrabold text-coral"
            style={{ fontSize: size * 0.34, transform: 'rotate(-8deg)' }}
          >
            {abbr}
          </span>
        </span>
      </span>
    </span>
  )
}

/** Word icon: calendar chip for weekdays, emoji for everything else. */
export function WordIcon({
  word,
  emoji,
  size = 72,
  fallback = '✏️',
}: {
  word?: string | null
  emoji?: string
  size?: number
  fallback?: string
}) {
  const abbr = weekdayAbbr(word)
  if (abbr) return <CalendarIcon abbr={abbr} size={size} />
  return <span style={{ fontSize: size * 0.75, lineHeight: 1 }}>{emoji || fallback}</span>
}
