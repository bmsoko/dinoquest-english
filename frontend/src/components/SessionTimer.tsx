import { useEffect, useRef, useState } from 'react'

const SESSION_SECONDS = 20 * 60 // 20 minutes

export interface TimerHandle {
  seconds: number
  paused: boolean
  finished: boolean
  togglePause: () => void
  restart: () => void
}

/** 20-minute session timer hook. Counts down; calls onFinish once at zero. */
export function useSessionTimer(onFinish: () => void): TimerHandle {
  const [seconds, setSeconds] = useState(SESSION_SECONDS)
  const [paused, setPaused] = useState(false)
  const [finished, setFinished] = useState(false)
  const finishRef = useRef(onFinish)
  finishRef.current = onFinish

  useEffect(() => {
    if (paused || finished) return
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(id)
          setFinished(true)
          finishRef.current()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [paused, finished])

  return {
    seconds,
    paused,
    finished,
    togglePause: () => setPaused((p) => !p),
    restart: () => {
      setSeconds(SESSION_SECONDS)
      setPaused(false)
      setFinished(false)
    },
  }
}

function fmt(total: number): string {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function TimerDisplay({ timer }: { timer: TimerHandle }) {
  // Turn amber under 5 min, coral under 1 min
  const low = timer.seconds <= 60
  const mid = timer.seconds <= 300
  const color = low
    ? 'bg-coral-pale border-coral text-coral-deep'
    : mid
      ? 'bg-sun-pale border-sun text-sun-deep'
      : 'bg-white border-sand-deep text-ink'

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`flex items-center gap-1 rounded-2xl border-2 px-2.5 py-1 font-display font-extrabold text-sm tabular-nums ${color} ${
          low && !timer.paused ? 'animate-pulse' : ''
        }`}
      >
        ⏳ {fmt(timer.seconds)}
      </span>
      <button
        onClick={timer.togglePause}
        aria-label={timer.paused ? 'resume' : 'pause'}
        className="btn-chunky bg-white border-sand-deep px-2.5 py-1 text-sm"
        style={{ borderWidth: '2px 2px 5px' }}
      >
        {timer.paused ? '▶' : '⏸'}
      </button>
    </div>
  )
}
