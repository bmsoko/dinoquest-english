import { useMemo, useState } from 'react'
import type { TestRendererProps } from '../types'
import { sfx } from '../sounds'
import { useLang } from '../i18n'
import { shuffle } from '../activities/shared'

export function Match({ item, onGraded }: TestRendererProps) {
  const { t } = useLang()
  const pairs = item.pairs ?? []
  const rights = useMemo(() => shuffle(pairs.map((p) => p.right)), [item])
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
  const [matched, setMatched] = useState<Record<string, string>>({}) // left -> right
  const [wrongFlash, setWrongFlash] = useState<string | null>(null)

  const finish = (m: Record<string, string>) => {
    const correct = pairs.filter((p) => m[p.left] === p.right).length
    correct === pairs.length ? sfx.correct() : sfx.wrong()
    onGraded(correct, pairs.length)
  }

  const pickRight = (right: string) => {
    if (!selectedLeft || matched[selectedLeft]) return
    const expected = pairs.find((p) => p.left === selectedLeft)?.right
    if (right === expected) {
      const m = { ...matched, [selectedLeft]: right }
      setMatched(m)
      setSelectedLeft(null)
      if (Object.keys(m).length === pairs.length) finish(m)
    } else {
      setWrongFlash(right)
      sfx.wrong()
      setTimeout(() => setWrongFlash(null), 500)
    }
  }

  const usedRights = new Set(Object.values(matched))

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center font-bold text-ink-soft">{t.match_help}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          {pairs.map((p) => (
            <button key={p.left} onClick={() => !matched[p.left] && setSelectedLeft(p.left)}
              disabled={!!matched[p.left]}
              className={`btn-chunky px-3 py-2 ${matched[p.left] ? 'bg-jungle border-jungle-deep text-white'
                : selectedLeft === p.left ? 'bg-sky border-sky-deep text-white' : 'bg-white border-sand-deep text-ink'}`}
              style={{ borderWidth: '2px 2px 4px' }}>
              {p.left}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {rights.map((r) => (
            <button key={r} onClick={() => pickRight(r)} disabled={usedRights.has(r)}
              className={`btn-chunky px-3 py-2 text-sm ${usedRights.has(r) ? 'bg-jungle-pale border-jungle text-jungle-deep opacity-70'
                : wrongFlash === r ? 'bg-coral border-coral-deep text-white' : 'bg-white border-sand-deep text-ink'}`}
              style={{ borderWidth: '2px 2px 4px' }}>
              {r}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Match
