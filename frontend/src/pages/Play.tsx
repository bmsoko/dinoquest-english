import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { api } from '../api'
import { sfx } from '../sounds'
import { useLang } from '../i18n'
import type {
  ActivityType,
  ExerciseItem,
  GameEvent,
  ItemResult,
  OwnedDino,
  PlayerState,
  RoundResultResponse,
  Species,
} from '../types'
import { TopBar } from '../components/TopBar'
import { EggBar } from '../components/EggBar'
import { TimerDisplay, useSessionTimer } from '../components/SessionTimer'
import { Companion, type CompanionMood } from '../components/Companion'
import { Wheel, activityLabel } from '../components/Wheel'
import { ActivityPicker } from '../components/ActivityPicker'
import { RewardOverlay } from '../components/RewardOverlay'
import { ListenChoose } from '../activities/ListenChoose'
import { Dictation } from '../activities/Dictation'
import { Unscramble } from '../activities/Unscramble'
import { FillIn } from '../activities/FillIn'
import { MemoryMatch } from '../activities/MemoryMatch'
import { Anagram } from '../activities/Anagram'
import { MissingLetter } from '../activities/MissingLetter'

type Phase = 'wheel' | 'loading' | 'round' | 'roundEnd' | 'noContent'

const ACTIVITY_COMPONENTS: Record<ActivityType, typeof ListenChoose> = {
  listen_choose: ListenChoose,
  dictation: Dictation,
  unscramble: Unscramble,
  fill_in: FillIn,
  memory: MemoryMatch,
  anagram: Anagram,
  missing_letter: MissingLetter,
}

export function Play() {
  const { t } = useLang()
  const [searchParams] = useSearchParams()
  const mode = searchParams.get('mode')
  const scope = mode === 'exam' ? 'exam' : mode === 'recent' ? 'recent' : 'all'
  const [player, setPlayer] = useState<PlayerState | null>(null)
  const [species, setSpecies] = useState<Species[]>([])
  const [phase, setPhase] = useState<Phase>('wheel')
  const [activity, setActivity] = useState<ActivityType>('listen_choose')
  const [items, setItems] = useState<ExerciseItem[]>([])
  const [combo, setCombo] = useState(0)
  const [mood, setMood] = useState<CompanionMood>('idle')
  const [lastResult, setLastResult] = useState<RoundResultResponse | null>(null)
  const [pendingEvents, setPendingEvents] = useState<GameEvent[]>([])
  const [roundsPlayed, setRoundsPlayed] = useState(0)
  const [xpFly, setXpFly] = useState<number | null>(null)
  const [timeUp, setTimeUp] = useState(false)
  // When set, the player chose a single activity (no wheel) — "one more" repeats it
  const [focusedActivity, setFocusedActivity] = useState<ActivityType | null>(null)
  const timer = useSessionTimer(() => {
    sfx.roundDone()
    setTimeUp(true)
  })

  const refreshPlayer = useCallback(async () => {
    const [p, s] = await Promise.all([api.get('/player'), api.get('/player/species')])
    setPlayer(p.data)
    setSpecies(s.data)
  }, [])

  useEffect(() => {
    refreshPlayer()
  }, [refreshPlayer])

  // "Latest added" goes straight into spelling practice on the newest words
  useEffect(() => {
    if (mode !== 'recent') return
    setFocusedActivity('dictation')
    startRound('dictation', false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const companion: OwnedDino | null =
    player?.dinos.find((d) => d.id === player.companion_id) ?? null

  const startRound = async (type: ActivityType, allowFallback = true) => {
    setPhase('loading')
    try {
      const res = await api.get('/play/round', { params: { type, count: 6, scope } })
      setActivity(type)
      setItems(res.data.items)
      setPhase('round')
    } catch {
      // Wheel mode: silently try another type. Focused practice: don't switch.
      if (allowFallback) {
        const fallbacks: ActivityType[] = ['listen_choose', 'dictation', 'fill_in', 'unscramble', 'memory', 'anagram', 'missing_letter']
        for (const fb of fallbacks.filter((f) => f !== type)) {
          try {
            const res = await api.get('/play/round', { params: { type: fb, count: 6, scope } })
            setActivity(fb)
            setItems(res.data.items)
            setPhase('round')
            return
          } catch { /* keep trying */ }
        }
      }
      setPhase('noContent')
    }
  }

  const handleAnswer = (correct: boolean) => {
    if (correct) {
      sfx.correct()
      setCombo((c) => c + 1)
      setMood('happy')
      setXpFly(10)
      setTimeout(() => setXpFly(null), 1000)
    } else {
      sfx.wrong()
      setCombo(0)
      setMood('oops')
    }
    setTimeout(() => setMood('idle'), 700)
  }

  const handleFinish = async (results: ItemResult[]) => {
    const res = await api.post('/play/result', { results })
    const data: RoundResultResponse = res.data
    setLastResult(data)
    setRoundsPlayed((r) => r + 1)
    setPlayer((p) => (p ? { ...p, ...data.player } : p))
    if (data.events.some((e) => e.type === 'egg_hatched')) await refreshPlayer()
    setPhase('roundEnd')
    sfx.roundDone()
    if (results.every((r) => r.correct) && results.length > 0) {
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.7 } })
    }
    if (data.events.length > 0) setPendingEvents(data.events)
  }

  const ActivityComponent = ACTIVITY_COMPONENTS[activity]

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 p-4 pb-8">
      <div className="flex items-center gap-3">
        <Link to="/" className="btn-chunky bg-white border-sand-deep px-3 py-1.5 text-lg" style={{ borderWidth: '2px 2px 5px' }}>
          ←
        </Link>
        <TopBar player={player} combo={combo} />
      </div>
      <div className="flex items-center justify-between gap-3">
        {player && <div className="flex-1"><EggBar progress={player.egg_progress} /></div>}
        <TimerDisplay timer={timer} />
      </div>

      <div className="relative flex-1">
        {xpFly && (
          <div className="pointer-events-none absolute right-4 top-4 z-20 animate-float-up font-display text-2xl font-extrabold text-jungle">
            +{xpFly} XP
          </div>
        )}

        {phase === 'wheel' && (
          <div className="flex flex-col items-center gap-6 pt-6">
            {scope === 'exam' && (
              <span className="animate-pop rounded-2xl bg-coral-pale border-2 border-coral px-4 py-1 font-display font-extrabold text-coral-deep">
                🎯 {t.exam_mode}
              </span>
            )}
            {scope === 'recent' && (
              <span className="animate-pop rounded-2xl border-2 border-sky bg-sky/15 px-4 py-1 font-display font-extrabold text-sky-deep">
                🆕 {t.latest_mode}
              </span>
            )}
            <h1 className="font-display text-3xl font-extrabold">{t.next_mission}</h1>
            <Wheel onResult={(type) => { setFocusedActivity(null); startRound(type) }} />
            <ActivityPicker onPick={(type) => { setFocusedActivity(type); startRound(type, false) }} />
          </div>
        )}

        {phase === 'loading' && (
          <div className="flex flex-col items-center pt-20 gap-4">
            <div className="animate-wiggle text-6xl">🦖</div>
          </div>
        )}

        {phase === 'round' && (
          <div className="card-toy p-5 sm:p-8">
            <h2 className="mb-4 text-center font-display text-2xl font-extrabold text-jungle-deep">
              {activityLabel(activity, t)}
            </h2>
            <ActivityComponent items={items} onAnswer={handleAnswer} onFinish={handleFinish} />
          </div>
        )}

        {phase === 'roundEnd' && lastResult && (
          <div className="card-toy animate-pop mx-auto max-w-sm p-8 text-center mt-6">
            <div className="text-6xl mb-2">🌋</div>
            <h2 className="font-display text-2xl font-extrabold">{t.round_done}</h2>
            <p className="mt-2 font-display text-4xl font-extrabold text-jungle">
              +{lastResult.xp_earned} XP
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={() => (focusedActivity ? startRound(focusedActivity, false) : setPhase('wheel'))}
                className="btn-chunky bg-jungle border-jungle-deep text-white text-xl px-8 py-3"
              >
                {focusedActivity ? `🔁 ${activityLabel(focusedActivity, t)}` : `🎡 ${t.one_more}`}
              </button>
              {focusedActivity && (
                <button
                  onClick={() => setPhase('wheel')}
                  className="btn-chunky bg-white border-sand-deep text-ink text-lg px-8 py-3"
                  style={{ borderWidth: '2px 2px 6px' }}
                >
                  🎡 {t.next_mission}
                </button>
              )}
              {roundsPlayed >= 2 && (
                <Link to="/" className="btn-chunky bg-white border-sand-deep text-ink text-lg px-8 py-3" style={{ borderWidth: '2px 2px 6px' }}>
                  {t.finish}
                </Link>
              )}
            </div>
          </div>
        )}

        {phase === 'noContent' && (
          <div className="card-toy mx-auto max-w-sm p-8 text-center mt-6">
            <div className="text-5xl mb-3">🦕</div>
            <p className="font-bold text-ink-soft">{t.no_units}</p>
            <Link to="/" className="btn-chunky mt-5 inline-block bg-white border-sand-deep px-6 py-2" style={{ borderWidth: '2px 2px 6px' }}>
              {t.back}
            </Link>
          </div>
        )}
      </div>

      <div className="fixed bottom-4 right-4">
        <Companion dino={companion} mood={mood} />
      </div>

      {pendingEvents.length > 0 && (
        <RewardOverlay
          events={pendingEvents}
          species={species}
          onDone={() => {
            setPendingEvents([])
            refreshPlayer()
          }}
        />
      )}

      {timeUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-6">
          <div className="card-toy animate-pop w-full max-w-sm p-8 text-center">
            <div className="text-6xl mb-2">⏰</div>
            <h2 className="font-display text-2xl font-extrabold text-sun-deep">{t.time_up_title}</h2>
            <p className="mt-2 font-bold text-ink-soft">{t.time_up_msg}</p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={() => {
                  timer.restart()
                  setTimeUp(false)
                  setPhase('wheel')
                }}
                className="btn-chunky bg-jungle border-jungle-deep text-white text-xl px-8 py-3"
              >
                🎡 {t.new_session}
              </button>
              <Link
                to="/"
                className="btn-chunky bg-white border-sand-deep text-ink text-lg px-8 py-3"
                style={{ borderWidth: '2px 2px 6px' }}
              >
                {t.stop_session}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
