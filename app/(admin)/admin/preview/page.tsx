'use client'

// app/(admin)/admin/preview/page.tsx
// "View as member" launcher. Admin picks one of the three programs, optionally
// pins to a specific day (handy for the Seal-the-Leak D1-D7 walkthrough or a
// 365-deck day), and lands on that program's natural home page with the
// preview banner active. Exit happens from the banner itself.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePreviewMode, type PreviewPath, type ArchetypeRoute } from '@/hooks/usePreviewMode'
import { fetchAdminCohorts } from '@/lib/admin/hooks'
import { useEffect } from 'react'

const ARCHETYPES: { id: ArchetypeRoute; name: string; color: string }[] = [
  { id: 'door',   name: 'The Open Door',          color: '#3D3080' },
  { id: 'throne', name: "The Overthinker's Throne", color: '#9B2C2C' },
  { id: 'engine', name: 'The Interrupted Engine', color: '#1F5C3A' },
  { id: 'push',   name: 'The Pushthrough',        color: '#B8922A' },
]

interface PathDescriptor {
  id: PreviewPath
  title: string
  subtitle: string
  home: string
  accent: string
  accentBg: string
  dayLabel: string
  dayMax: number
}

const PATHS: PathDescriptor[] = [
  {
    id: 'B',
    title: 'Daily Cards',
    subtitle: '365-day deck. Members see one card per day plus the journal.',
    home: '/card',
    accent: 'var(--green)',
    accentBg: 'rgba(31,92,58,0.08)',
    dayLabel: 'Day in the deck',
    dayMax: 365,
  },
  {
    id: 'A',
    title: 'Seal the Leak',
    subtitle: '7-day reset program. Today’s session walks D1–D7.',
    home: '/program/today',
    accent: '#3D3080',
    accentBg: 'rgba(61,48,128,0.08)',
    dayLabel: 'Day of the program',
    dayMax: 7,
  },
  {
    id: 'C',
    title: 'The Circle',
    subtitle: '12-week cohort with weekly content + accountability partner.',
    home: '/circle',
    accent: '#C97D3A',
    accentBg: 'rgba(201,125,58,0.08)',
    dayLabel: 'Week to focus on',
    dayMax: 12,
  },
]

export default function AdminPreviewPage() {
  const router = useRouter()
  const { preview, setPreview } = usePreviewMode()

  const [pathId, setPathId] = useState<PreviewPath>(preview?.path ?? 'B')
  const [day, setDay] = useState<number>(preview?.dayOverride ?? 1)
  const [cohortId, setCohortId] = useState<string>(preview?.cohortId ?? '')
  const [cohorts, setCohorts] = useState<{ id: string; name: string }[]>([])
  const [archetype, setArchetype] = useState<ArchetypeRoute>(preview?.archetypeOverride ?? 'door')

  useEffect(() => {
    fetchAdminCohorts().then(c => setCohorts(c.filter(x => x.status === 'active').map(x => ({ id: x.id, name: x.name }))))
  }, [])

  const path = PATHS.find(p => p.id === pathId) ?? PATHS[0]

  function start() {
    setPreview({
      path: pathId,
      dayOverride: day,
      cohortId: pathId === 'C' ? (cohortId || null) : null,
      archetypeOverride: pathId === 'A' ? archetype : null,
      startedAt: Date.now(),
    })
    // Both Seal the Leak (?day on /program/today) and Daily Cards (?day on
    // /card) already support landing on a specific day. Pass it along so the
    // admin doesn't have to navigate inside the program.
    const target = (pathId === 'A' || pathId === 'B') ? `${path.home}?day=${day}` : path.home
    router.push(target)
  }

  function stop() {
    setPreview(null)
  }

  const S = {
    eyebrow: { fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', margin: '0 0 8px' },
    h1: { fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 300, color: 'var(--ink)', letterSpacing: '-0.015em', lineHeight: 1.1, margin: 0 },
    sub: { fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.55, margin: '8px 0 0', maxWidth: 520 },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: 12,
      marginBottom: 20,
    } as const,
    card: (on: boolean, accent: string, accentBg: string) => {
      const sideBorder = `1px solid ${on ? accent : 'var(--line)'}`
      return {
        background: on ? accentBg : '#fff',
        // Split sides instead of `border` shorthand so we don't conflict with borderLeft.
        borderTop: sideBorder,
        borderRight: sideBorder,
        borderBottom: sideBorder,
        borderLeft: `4px solid ${accent}`,
        borderRadius: 12,
        padding: 16,
        cursor: 'pointer',
        transition: 'background 0.15s ease, border-color 0.15s ease',
      } as const
    },
    pill: (accent: string) => ({
      display: 'inline-block', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
      textTransform: 'uppercase' as const,
      padding: '2px 8px', borderRadius: 999,
      background: '#fff', color: accent, border: `1px solid ${accent}40`,
    }),
    label: { fontSize: 10, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', marginBottom: 6, display: 'block' as const },
    input: {
      background: '#fff', border: '1px solid var(--line-md)', borderRadius: 8,
      color: 'var(--ink)', fontSize: 13, padding: '8px 12px', outline: 'none',
      fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' as const,
    },
    btnPrimary: {
      fontSize: 13, fontWeight: 600, padding: '10px 18px', borderRadius: 8,
      cursor: 'pointer', border: 'none', background: 'var(--gold)', color: '#fff',
      fontFamily: 'inherit',
    },
    btnGhost: {
      fontSize: 13, fontWeight: 500, padding: '10px 18px', borderRadius: 8,
      cursor: 'pointer', border: '1px solid var(--line-md)', background: '#fff',
      color: 'var(--text-soft)', fontFamily: 'inherit',
    },
  }

  return (
    <div style={{ color: 'var(--ink)' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={S.eyebrow}>Tools</div>
        <h1 style={S.h1}>View as member</h1>
        <p style={S.sub}>
          Build a preview, save, and land on the user portal as if you were that kind of member.
          A banner across the top reminds you you&apos;re in preview, and clicking &ldquo;Exit preview&rdquo;
          drops you back here.
        </p>
      </div>

      {preview && (
        <div style={{
          background: 'var(--gold-pale)',
          border: '1px solid var(--gold-line)',
          borderRadius: 10,
          padding: '10px 14px',
          marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          fontSize: 12, color: 'var(--ink)',
        }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)' }}>
            Currently active
          </span>
          <span>
            {PATHS.find(p => p.id === preview.path)?.title}
            {preview.archetypeOverride ? ` · ${ARCHETYPES.find(a => a.id === preview.archetypeOverride)?.name}` : ''}
            {preview.dayOverride ? ` · Day ${preview.dayOverride}` : ''}
          </span>
          <button onClick={stop} style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 500, color: 'var(--text-soft)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            Clear active preview
          </button>
        </div>
      )}

      {/* 1. Pick the program */}
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
        1 · Pick the program
      </div>
      <div style={S.grid}>
        {PATHS.map(p => {
          const on = pathId === p.id
          return (
            <div
              key={p.id}
              onClick={() => { setPathId(p.id); setDay(1) }}
              style={S.card(on, p.accent, p.accentBg)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={S.pill(p.accent)}>Path {p.id}</span>
                {on && <span style={{ fontSize: 11, color: p.accent, fontWeight: 600 }}>Selected</span>}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, color: 'var(--ink)', marginBottom: 4 }}>
                {p.title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-soft)', lineHeight: 1.55 }}>
                {p.subtitle}
              </div>
            </div>
          )
        })}
      </div>

      {/* 2. Settings */}
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
        2 · Configure the view
      </div>
      <div style={{
        background: '#fff', border: '1px solid var(--line)', borderRadius: 10,
        padding: '14px 16px', marginBottom: 24,
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14,
      }}>
        <div>
          <label style={S.label}>{path.dayLabel}</label>
          <input
            type="number" min={1} max={path.dayMax}
            value={day}
            onChange={e => setDay(Math.max(1, Math.min(path.dayMax, Number(e.target.value) || 1)))}
            style={S.input}
          />
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '6px 0 0' }}>
            {pathId === 'A' && 'Lands you on /program/today?day=N.'}
            {pathId === 'B' && 'Lands you on /card?day=N. The day badge and locked-cards list also reflect this day while preview is active.'}
            {pathId === 'C' && 'Cohort phase / week reference.'}
          </p>
        </div>
        {pathId === 'A' && (
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={S.label}>Archetype</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {ARCHETYPES.map(a => {
                const on = archetype === a.id
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setArchetype(a.id)}
                    style={{
                      fontSize: 12, fontWeight: 600,
                      padding: '7px 14px', borderRadius: 999,
                      border: `1.5px solid ${on ? a.color : 'var(--line-md)'}`,
                      background: on ? a.color : '#fff',
                      color: on ? '#fff' : 'var(--text-soft)',
                      cursor: 'pointer', fontFamily: 'inherit',
                      transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease',
                    }}
                  >
                    {a.name}
                  </button>
                )
              })}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '6px 0 0' }}>
              Overrides the user&apos;s quiz result so you see the program through this archetype&apos;s lens.
            </p>
          </div>
        )}
        {pathId === 'C' && (
          <div>
            <label style={S.label}>Cohort scope</label>
            <select
              value={cohortId}
              onChange={e => setCohortId(e.target.value)}
              style={{ ...S.input, cursor: 'pointer' }}
            >
              <option value="">— No specific cohort —</option>
              {cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '6px 0 0' }}>
              Optional. Shown in the banner so you remember which cohort you&apos;re shadowing.
            </p>
          </div>
        )}
      </div>

      {/* 3. Save & enter */}
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
        3 · Save & enter
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={start} style={S.btnPrimary}>
          Save & view {path.title} →
        </button>
        {preview && (
          <button onClick={stop} style={S.btnGhost}>
            Clear preview
          </button>
        )}
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 18, lineHeight: 1.6 }}>
        Preview state is stored in <code style={{ fontSize: 10 }}>sessionStorage</code> and only persists in this tab.
        Members never see the banner — it&apos;s a no-op for non-admins.
      </p>
    </div>
  )
}
