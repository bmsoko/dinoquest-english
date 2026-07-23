import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useLang } from '../i18n'
import type { GeneratedUnit, PlayerListItem, Theme, UnitSummary } from '../types'

export function ParentZone() {
  const { t, lang } = useLang()
  const [unlocked, setUnlocked] = useState(sessionStorage.getItem('parentUnlocked') === '1')
  const [gatePin, setGatePin] = useState('')
  const [gateError, setGateError] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<GeneratedUnit | null>(null)
  const [units, setUnits] = useState<UnitSummary[]>([])
  const [error, setError] = useState<string | null>(null)
  const [savedMsg, setSavedMsg] = useState(false)
  const [kind, setKind] = useState<'unit' | 'exam'>('unit')

  const [players, setPlayers] = useState<PlayerListItem[]>([])
  const [themes, setThemes] = useState<Theme[]>([])
  const [wordDrafts, setWordDrafts] = useState<Record<number, string>>({})
  const [addingTo, setAddingTo] = useState<number | null>(null)
  const [wordResult, setWordResult] = useState<{ unitId: number; added: string[]; skipped: string[] } | null>(null)
  const [edits, setEdits] = useState<Record<number, { name: string; pin: string; theme: string }>>({})

  const loadUnits = () => api.get('/units').then((r) => setUnits(r.data))
  const loadPlayers = () =>
    api.get('/players').then((r) => {
      setPlayers(r.data)
      setEdits(
        Object.fromEntries(
          r.data.map((p: PlayerListItem) => [p.id, { name: p.name, pin: '', theme: p.theme }]),
        ),
      )
    })

  useEffect(() => {
    if (!unlocked) return
    loadUnits()
    loadPlayers()
    api.get('/player/themes').then((r) => setThemes(r.data))
  }, [unlocked])

  const tryUnlock = async () => {
    localStorage.setItem('parentPin', gatePin)
    try {
      await api.get('/units/pin-check')
      sessionStorage.setItem('parentUnlocked', '1')
      setUnlocked(true)
    } catch {
      localStorage.removeItem('parentPin')
      setGateError(true)
      setGatePin('')
    }
  }

  const savePlayer = async (p: PlayerListItem, clearPin = false) => {
    const e = edits[p.id]
    const payload: Record<string, string> = {}
    if (e.name !== p.name) payload.name = e.name
    if (e.theme !== p.theme) payload.theme = e.theme
    if (clearPin) payload.pin = ''
    else if (e.pin) payload.pin = e.pin
    if (Object.keys(payload).length === 0) return
    await api.patch(`/players/${p.id}`, payload)
    loadPlayers()
  }

  const addWords = async (unit: UnitSummary) => {
    const text = wordDrafts[unit.id]?.trim()
    if (!text) return
    setAddingTo(unit.id)
    setWordResult(null)
    try {
      const singleWord = /spelling/i.test(unit.title)
      const res = await api.post(`/units/${unit.id}/words`, {
        words: text.split('\n'),
        single_word: singleWord,
      })
      setWordResult({ unitId: unit.id, ...res.data })
      setWordDrafts({ ...wordDrafts, [unit.id]: '' })
      loadUnits()
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail ?? 'Error agregando palabras')
    } finally {
      setAddingTo(null)
    }
  }

  const deletePlayer = async (p: PlayerListItem) => {
    if (!confirm(`¿Borrar jugador "${p.name}" y todo su progreso?`)) return
    await api.delete(`/players/${p.id}`)
    loadPlayers()
  }

  const generate = async () => {
    setGenerating(true)
    setError(null)
    setPreview(null)
    try {
      const res = await api.post('/units/generate', { prompt })
      setPreview(res.data)
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail ?? 'Error generando la unidad')
    } finally {
      setGenerating(false)
    }
  }

  const save = async () => {
    if (!preview) return
    setSaving(true)
    setError(null)
    try {
      await api.post('/units', { source_prompt: prompt, unit: preview, kind })
      setPreview(null)
      setPrompt('')
      setSavedMsg(true)
      setTimeout(() => setSavedMsg(false), 3000)
      loadUnits()
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail ?? 'Error guardando la unidad')
    } finally {
      setSaving(false)
    }
  }

  const toggleUnit = async (unit: UnitSummary) => {
    await api.patch(`/units/${unit.id}?active=${!unit.active}`)
    loadUnits()
  }

  const deleteUnit = async (unit: UnitSummary) => {
    if (!confirm(`¿Borrar "${unit.title}"?`)) return
    await api.delete(`/units/${unit.id}`)
    loadUnits()
  }

  const exerciseCounts = preview
    ? Object.entries(
        preview.exercises.reduce<Record<string, number>>((acc, ex) => {
          const type = String(ex.type)
          acc[type] = (acc[type] ?? 0) + 1
          return acc
        }, {}),
      )
    : []

  if (!unlocked) {
    return (
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-4 p-6">
        <div className={`card-toy w-full max-w-xs p-6 text-center flex flex-col gap-4 ${gateError ? 'animate-shake' : ''}`}>
          <span className="text-5xl">🔒</span>
          <h1 className="font-display text-xl font-extrabold">{t.pz_title}</h1>
          <input
            value={gatePin}
            onChange={(e) => { setGatePin(e.target.value.replace(/\D/g, '').slice(0, 6)); setGateError(false) }}
            onKeyDown={(e) => e.key === 'Enter' && tryUnlock()}
            inputMode="numeric"
            type="password"
            autoFocus
            placeholder="PIN"
            className="w-full rounded-xl border-2 border-sand-deep px-4 py-3 text-center font-display text-3xl font-extrabold tracking-[0.5em] focus:border-jungle focus:outline-none"
          />
          {gateError && <p className="font-bold text-coral-deep">{t.wrong_pin}</p>}
          <button
            onClick={tryUnlock}
            disabled={!gatePin}
            className="btn-chunky bg-jungle border-jungle-deep text-white text-xl px-8 py-3"
          >
            {t.enter}
          </button>
        </div>
        <Link to="/" className="text-sm font-bold text-ink-soft underline">
          ← {t.back}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-screen max-w-3xl p-6 font-body">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">⚙️ {t.pz_title}</h1>
        <Link to="/" className="text-sm font-bold text-ink-soft underline">
          ← {t.back}
        </Link>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setKind('unit')}
          className={`rounded-xl px-4 py-2 font-bold border-2 ${kind === 'unit' ? 'bg-jungle text-white border-jungle-deep' : 'bg-white border-sand-deep text-ink-soft'}`}
        >
          {t.pz_tab_unit}
        </button>
        <button
          onClick={() => setKind('exam')}
          className={`rounded-xl px-4 py-2 font-bold border-2 ${kind === 'exam' ? 'bg-coral text-white border-coral-deep' : 'bg-white border-sand-deep text-ink-soft'}`}
        >
          {t.pz_tab_exam}
        </button>
      </div>

      <p className="mb-4 text-ink-soft">{kind === 'exam' ? t.pz_exam_intro : t.pz_intro}</p>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={t.pz_placeholder}
        rows={10}
        className="w-full rounded-xl border-2 border-sand-deep bg-white p-4 text-sm leading-relaxed focus:border-jungle focus:outline-none"
      />

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={generate}
          disabled={generating || !prompt.trim()}
          className="rounded-xl bg-jungle px-5 py-2.5 font-bold text-white disabled:opacity-50"
        >
          {generating ? t.pz_generating : `✨ ${t.pz_generate}`}
        </button>
        {savedMsg && <span className="font-bold text-jungle">{t.pz_saved}</span>}
      </div>

      {error && (
        <div className="mt-3 rounded-xl bg-coral-pale border border-coral px-4 py-2 text-sm font-bold text-coral-deep">
          {error}
        </div>
      )}

      {preview && (
        <div className="mt-6 rounded-2xl border-2 border-sand-deep bg-white p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="font-display text-lg font-bold">
              {t.pz_preview}: {preview.title}
            </h2>
            <button
              onClick={save}
              disabled={saving}
              className="rounded-xl bg-sun px-5 py-2 font-bold text-white disabled:opacity-50"
            >
              {saving ? t.pz_saving : `💾 ${t.pz_save}`}
            </button>
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            {preview.words.length} {t.pz_words} ·{' '}
            {exerciseCounts.map(([k, v]) => `${k}: ${v}`).join(' · ')}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {preview.words.map((w) => (
              <div key={w.text} className="rounded-lg bg-sand px-3 py-2 text-sm">
                <span className="mr-1">{w.emoji}</span>
                <span className="font-bold">{w.text}</span>
                <span className="text-ink-soft"> · {w.translation}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="mt-8 mb-3 font-display text-lg font-bold">{t.pz_players}</h2>
      <div className="flex flex-col gap-2">
        {players.map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-sand-deep bg-white px-4 py-3"
          >
            <span className="text-3xl">{p.avatar}</span>
            <input
              value={edits[p.id]?.name ?? p.name}
              onChange={(e) => setEdits({ ...edits, [p.id]: { ...edits[p.id], name: e.target.value } })}
              maxLength={20}
              className="w-36 rounded-lg border-2 border-sand-deep px-2 py-1 font-bold focus:border-jungle focus:outline-none"
            />
            <select
              value={edits[p.id]?.theme ?? p.theme}
              onChange={(e) => setEdits({ ...edits, [p.id]: { ...edits[p.id], theme: e.target.value } })}
              className="rounded-lg border-2 border-sand-deep px-2 py-1 text-sm font-bold focus:border-jungle focus:outline-none"
            >
              {themes.map((th) => (
                <option key={th.id} value={th.id}>
                  {th.emoji} {lang === 'es' ? th.name_es : th.name_en}
                </option>
              ))}
            </select>
            <input
              value={edits[p.id]?.pin ?? ''}
              onChange={(e) =>
                setEdits({ ...edits, [p.id]: { ...edits[p.id], pin: e.target.value.replace(/\D/g, '').slice(0, 6) } })
              }
              placeholder={p.has_pin ? `🔒 ${t.pz_pin_set}` : t.pz_no_pin}
              inputMode="numeric"
              className="w-28 rounded-lg border-2 border-sand-deep px-2 py-1 text-sm font-bold focus:border-jungle focus:outline-none"
            />
            <button onClick={() => savePlayer(p)} className="rounded-lg bg-jungle px-3 py-1.5 text-sm font-bold text-white">
              {t.pz_save_player}
            </button>
            {p.has_pin && (
              <button onClick={() => savePlayer(p, true)} className="text-sm font-bold text-ink-soft underline">
                {t.pz_no_pin}
              </button>
            )}
            {players.length > 1 && (
              <button onClick={() => deletePlayer(p)} className="ml-auto text-sm font-bold text-coral-deep underline">
                {t.pz_delete}
              </button>
            )}
          </div>
        ))}
      </div>

      <h2 className="mt-8 mb-3 font-display text-lg font-bold">{t.pz_units}</h2>
      <div className="flex flex-col gap-2">
        {units.map((unit) => (
          <div
            key={unit.id}
            className="rounded-xl border-2 border-sand-deep bg-white px-4 py-3"
          >
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-bold">
                  {unit.kind === 'exam' && (
                    <span className="mr-1.5 rounded-md bg-coral-pale px-1.5 py-0.5 text-xs font-extrabold text-coral-deep">
                      🎯 EXAMEN
                    </span>
                  )}
                  {unit.title}
                </p>
                <p className="text-xs text-ink-soft">
                  {unit.word_count} {t.pz_words} · {new Date(unit.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-sm font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={unit.active}
                    onChange={() => toggleUnit(unit)}
                    className="h-4 w-4 accent-jungle"
                  />
                  {t.pz_active}
                </label>
                <button
                  onClick={() => deleteUnit(unit)}
                  className="text-sm font-bold text-coral-deep underline"
                >
                  {t.pz_delete}
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start">
              <textarea
                value={wordDrafts[unit.id] ?? ''}
                onChange={(e) => setWordDrafts({ ...wordDrafts, [unit.id]: e.target.value })}
                placeholder={t.pz_words_placeholder}
                rows={2}
                className="flex-1 rounded-lg border-2 border-sand-deep px-3 py-2 text-sm focus:border-jungle focus:outline-none"
              />
              <button
                onClick={() => addWords(unit)}
                disabled={addingTo === unit.id || !(wordDrafts[unit.id] ?? '').trim()}
                className="rounded-lg bg-sun px-3 py-2 text-sm font-bold text-white disabled:opacity-50 whitespace-nowrap"
              >
                {addingTo === unit.id ? t.pz_adding : t.pz_add_words}
              </button>
            </div>
            {wordResult?.unitId === unit.id && (
              <p className="mt-2 text-sm font-bold">
                <span className="text-jungle-deep">
                  ✓ {t.pz_added} {wordResult.added.length}
                </span>
                {wordResult.added.length > 0 && (
                  <span className="font-normal text-ink-soft"> ({wordResult.added.join(', ')})</span>
                )}
                {wordResult.skipped.length > 0 && (
                  <span className="text-sun-deep">
                    {' · '}
                    {wordResult.skipped.length} {t.pz_already}
                    <span className="font-normal text-ink-soft"> ({wordResult.skipped.join(', ')})</span>
                  </span>
                )}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
