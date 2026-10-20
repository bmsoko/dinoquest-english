import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { api } from '../api'
import { useLang } from '../i18n'
import type { GameEvent, PlayerState, Species, TestItem, TestPaper, TestSection } from '../types'
import { Companion } from '../components/Companion'
import { RewardOverlay } from '../components/RewardOverlay'
import { ListenPick } from '../test/ListenPick'
import { Mcq } from '../test/Mcq'
import { GapBank } from '../test/GapBank'
import { Match } from '../test/Match'
import { Order } from '../test/Order'
import { Reading } from '../test/Reading'

type Phase = 'intro' | 'running' | 'report' | 'empty'
type Screen = { section: TestSection; item: TestItem }

const RENDERERS = { listen_pick: ListenPick, mcq: Mcq, gap_bank: GapBank, match: Match, order: Order, reading: Reading }

export function TestPractice() {
  const { t } = useLang()
  const [phase, setPhase] = useState<Phase>('intro')
  const [paper, setPaper] = useState<TestPaper | null>(null)
  const [screens, setScreens] = useState<Screen[]>([])
  const [idx, setIdx] = useState(0)
  const [graded, setGraded] = useState<{ c: number; tot: number } | null>(null)
  const [scores, setScores] = useState<Record<string, { correct: number; total: number }>>({})
  const [player, setPlayer] = useState<PlayerState | null>(null)
  const [species, setSpecies] = useState<Species[]>([])
  const [xpEarned, setXpEarned] = useState(0)
  const [events, setEvents] = useState<GameEvent[]>([])

  const load = useCallback(async () => {
    const [p, s] = await Promise.all([api.get('/player'), api.get('/player/species')])
    setPlayer(p.data); setSpecies(s.data)
  }, [])
  useEffect(() => { load() }, [load])

  const companion = player?.dinos.find((d) => d.id === player.companion_id) ?? null

  const start = async () => {
    try {
      const res = await api.get('/test/paper', { params: { topic: 'unit4' } })
      const data: TestPaper = res.data
      const flat: Screen[] = data.sections.flatMap((sec) => sec.items.map((item) => ({ section: sec.section, item })))
      if (flat.length === 0) { setPhase('empty'); return }
      setPaper(data); setScreens(flat); setIdx(0); setScores({}); setGraded(null); setXpEarned(0); setEvents([]); setPhase('running')
    } catch { setPhase('empty') }
  }

  const onGraded = (c: number, tot: number) => setGraded({ c, tot })

  const next = async () => {
    if (!graded) return
    const cur = screens[idx]
    setScores((prev) => {
      const s = prev[cur.section] ?? { correct: 0, total: 0 }
      return { ...prev, [cur.section]: { correct: s.correct + graded.c, total: s.total + graded.tot } }
    })
    setGraded(null)
    if (idx + 1 < screens.length) { setIdx(idx + 1); return }
    // Finished — compute totals and submit
    const finalScores: Record<string, { correct: number; total: number }> = { ...scores }
    const s = finalScores[cur.section] ?? { correct: 0, total: 0 }
    finalScores[cur.section] = { correct: s.correct + graded.c, total: s.total + graded.tot }
    const correct = Object.values(finalScores).reduce((a, b) => a + b.correct, 0)
    const total = Object.values(finalScores).reduce((a, b) => a + b.total, 0)
    const sections = Object.entries(finalScores).map(([section, v]) => ({ section, ...v }))
    setScores(finalScores)
    try {
      const res = await api.post('/test/result', { topic: 'unit4', correct, total, sections })
      setXpEarned(res.data.xp_earned)
      setEvents(res.data.events ?? [])
      setPlayer((p) => (p ? { ...p, ...res.data.player } : p))
    } catch {
      setXpEarned(0)
    }
    setPhase('report')
    if (correct === total && total > 0) confetti({ particleCount: 90, spread: 80, origin: { y: 0.7 } })
  }

  const totals = useMemo(() => {
    const correct = Object.values(scores).reduce((a, b) => a + b.correct, 0)
    const total = Object.values(scores).reduce((a, b) => a + b.total, 0)
    return { correct, total }
  }, [scores])

  const stars = totals.total ? (totals.correct / totals.total >= 0.9 ? 3 : totals.correct / totals.total >= 0.7 ? 2 : totals.correct / totals.total >= 0.5 ? 1 : 0) : 0
  const sectionLabel = (s: string) => (t as Record<string, string>)[`sec_${s}`] ?? s

  const cur = screens[idx]
  const Renderer = cur ? RENDERERS[cur.item.format] : null
  const partNumber = cur ? paper!.sections.findIndex((x) => x.section === cur.section) + 1 : 0

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 p-4 pb-8">
      <div className="flex items-center gap-3">
        <Link to="/" className="btn-chunky bg-white border-sand-deep px-3 py-1.5 text-lg" style={{ borderWidth: '2px 2px 5px' }}>←</Link>
        <h1 className="font-display text-2xl font-extrabold text-jungle-deep">📝 {t.test_practice}</h1>
      </div>

      {phase === 'intro' && (
        <div className="card-toy mx-auto mt-8 max-w-sm p-8 text-center">
          <div className="text-6xl mb-2">📝</div>
          <h2 className="font-display text-2xl font-extrabold">Unit 4 · Family &amp; Homes</h2>
          <p className="mt-2 font-bold text-ink-soft">{t.test_intro}</p>
          <button onClick={start} className="btn-chunky mt-6 bg-jungle border-jungle-deep text-white text-xl px-8 py-3">
            {t.test_start}
          </button>
        </div>
      )}

      {phase === 'empty' && (
        <div className="card-toy mx-auto mt-8 max-w-sm p-8 text-center">
          <div className="text-5xl mb-3">🦕</div>
          <p className="font-bold text-ink-soft">{t.no_units}</p>
          <Link to="/" className="btn-chunky mt-5 inline-block bg-white border-sand-deep px-6 py-2" style={{ borderWidth: '2px 2px 6px' }}>{t.back}</Link>
        </div>
      )}

      {phase === 'running' && cur && Renderer && (
        <>
          <div className="text-center font-display font-extrabold text-ink-soft">
            {t.test_part} {partNumber} {t.test_of} {paper!.sections.length} · {sectionLabel(cur.section)}
          </div>
          <div className="card-toy p-5 sm:p-8">
            <Renderer key={idx} item={cur.item} onGraded={onGraded} />
          </div>
          <button onClick={next} disabled={!graded}
            className="btn-chunky mx-auto bg-sun border-sun-deep text-white text-xl px-10 py-3 disabled:opacity-40">
            {t.test_next} →
          </button>
        </>
      )}

      {phase === 'report' && (
        <div className="card-toy animate-pop mx-auto mt-6 max-w-sm p-8 text-center">
          <div className="text-5xl">{'⭐'.repeat(stars) || '🦕'}</div>
          <h2 className="mt-2 font-display text-2xl font-extrabold">{t.test_report_title}</h2>
          <p className="mt-1 font-display text-4xl font-extrabold text-jungle">{totals.correct}/{totals.total}</p>
          <p className="font-bold text-jungle-deep">+{xpEarned} XP</p>
          <div className="mt-4 flex flex-col gap-1 text-left">
            {Object.entries(scores).map(([section, v]) => (
              <div key={section} className="flex justify-between rounded-lg bg-sand px-3 py-1 font-bold">
                <span>{sectionLabel(section)}</span><span>{v.correct}/{v.total}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <button onClick={start} className="btn-chunky bg-jungle border-jungle-deep text-white text-xl px-8 py-3">🔁 {t.test_play_again}</button>
            <Link to="/" className="btn-chunky bg-white border-sand-deep text-ink text-lg px-8 py-3" style={{ borderWidth: '2px 2px 6px' }}>{t.finish}</Link>
          </div>
        </div>
      )}

      <div className="fixed bottom-4 right-4"><Companion dino={companion} mood="idle" /></div>

      {events.length > 0 && (
        <RewardOverlay events={events} species={species} onDone={() => { setEvents([]); load() }} />
      )}
    </div>
  )
}
