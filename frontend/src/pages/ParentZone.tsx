import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useLang } from '../i18n'
import type { GeneratedUnit, UnitSummary } from '../types'

export function ParentZone() {
  const { t } = useLang()
  const [prompt, setPrompt] = useState('')
  const [pin, setPin] = useState(localStorage.getItem('parentPin') ?? '')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<GeneratedUnit | null>(null)
  const [units, setUnits] = useState<UnitSummary[]>([])
  const [error, setError] = useState<string | null>(null)
  const [savedMsg, setSavedMsg] = useState(false)
  const [kind, setKind] = useState<'unit' | 'exam'>('unit')

  const loadUnits = () => api.get('/units').then((r) => setUnits(r.data))

  useEffect(() => {
    loadUnits()
  }, [])

  const savePin = (value: string) => {
    setPin(value)
    localStorage.setItem('parentPin', value)
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

      <input
        type="password"
        value={pin}
        onChange={(e) => savePin(e.target.value)}
        placeholder={t.pz_pin}
        className="mb-3 w-40 rounded-lg border-2 border-sand-deep bg-white px-3 py-1.5 text-sm"
      />

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

      <h2 className="mt-8 mb-3 font-display text-lg font-bold">{t.pz_units}</h2>
      <div className="flex flex-col gap-2">
        {units.map((unit) => (
          <div
            key={unit.id}
            className="flex items-center justify-between rounded-xl border-2 border-sand-deep bg-white px-4 py-3"
          >
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
        ))}
      </div>
    </div>
  )
}
