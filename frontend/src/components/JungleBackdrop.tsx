/**
 * Fixed decorative scene behind every screen: distant volcano + hills, a
 * foliage horizon along the bottom, drifting leaves and twinkles.
 * Purely decorative — never intercepts taps.
 */

const LEAVES = [
  { emoji: '🍃', left: '6%', delay: '0s', duration: '19s', size: 22 },
  { emoji: '🌿', left: '24%', delay: '5s', duration: '24s', size: 18 },
  { emoji: '🍃', left: '48%', delay: '11s', duration: '21s', size: 16 },
  { emoji: '🌸', left: '68%', delay: '3s', duration: '26s', size: 18 },
  { emoji: '🍃', left: '86%', delay: '8s', duration: '23s', size: 20 },
]

const SPARKS = [
  { left: '12%', top: '18%', delay: '0s' },
  { left: '78%', top: '12%', delay: '0.8s' },
  { left: '62%', top: '30%', delay: '1.6s' },
  { left: '30%', top: '38%', delay: '2.2s' },
]

export function JungleBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Sun */}
      <div
        className="absolute rounded-full"
        style={{
          top: '-70px',
          right: '-40px',
          width: 240,
          height: 240,
          background: 'radial-gradient(circle, rgba(249,168,37,0.35) 0%, rgba(249,168,37,0.12) 45%, transparent 70%)',
        }}
      />

      {/* Twinkles */}
      {SPARKS.map((s, i) => (
        <span
          key={i}
          className="absolute animate-twinkle text-lg"
          style={{ left: s.left, top: s.top, animationDelay: s.delay }}
        >
          ✨
        </span>
      ))}

      {/* Drifting foliage */}
      {LEAVES.map((l, i) => (
        <span
          key={i}
          className="absolute animate-drift"
          style={{
            left: l.left,
            fontSize: l.size,
            animationDelay: l.delay,
            animationDuration: l.duration,
          }}
        >
          {l.emoji}
        </span>
      ))}

      {/* Horizon: hills + volcano + foliage, anchored to the bottom */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        style={{ height: '38vh', minHeight: 220 }}
      >
        {/* far hills */}
        <path
          d="M0 210 Q 150 150 300 195 T 620 180 Q 780 130 940 185 T 1240 170 Q 1350 150 1440 190 L1440 320 L0 320Z"
          fill="#bfe6d3"
          opacity="0.75"
        />
        {/* volcano */}
        <path d="M980 200 L1090 78 L1200 200 Z" fill="#9ed6bd" opacity="0.85" />
        <path d="M1060 108 L1090 78 L1122 110 Q1095 96 1060 108Z" fill="#f4703f" opacity="0.7" />
        {/* near hills */}
        <path
          d="M0 245 Q 200 200 420 240 T 860 232 Q 1080 196 1260 242 T 1440 236 L1440 320 L0 320Z"
          fill="#8fd3b6"
          opacity="0.85"
        />
        {/* grass edge */}
        <path
          d="M0 282 Q 120 262 240 282 T 480 282 T 720 282 T 960 282 T 1200 282 T 1440 282 L1440 320 L0 320Z"
          fill="#5cc298"
          opacity="0.9"
        />
      </svg>

      {/* Foreground fronds peeking in from the corners */}
      <span
        className="absolute animate-sway select-none"
        style={{ bottom: '-14px', left: '-18px', fontSize: 108, transformOrigin: 'bottom left' }}
      >
        🌴
      </span>
      <span
        className="absolute animate-sway select-none"
        style={{
          bottom: '-18px',
          right: '-14px',
          fontSize: 96,
          transformOrigin: 'bottom right',
          animationDelay: '1.5s',
          transform: 'scaleX(-1)',
        }}
      >
        🌿
      </span>
    </div>
  )
}
