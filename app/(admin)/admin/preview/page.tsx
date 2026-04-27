'use client'

// app/(admin)/admin/preview/page.tsx
// "View as member" launcher. Admin picks one of the three programs, optionally
// pins to a specific day (handy for the Seal-the-Leak D1-D7 walkthrough or a
// 365-deck day), and lands on that program's natural home page with the
// preview banner active. Exit happens from the banner itself.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePreviewMode, type PreviewPath } from '@/hooks/usePreviewMode'
import { fetchAdminCohorts } from '@/lib/admin/hooks'
import { useEffect } from 'react'

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
    subtitle: '7-day reset cohort program. Today’s session walks D1–D7.',
    home: '/program/today',
    accent: '#3D3080',
    accentBg: 'rgba(61,48,128,0.08)',
    dayLabel: 'Day of the program',
    dayMax: 7,
  },
  {
    id: 'C',
    title: 'The Circle',
    subtitle: '90-day cohort with weekly content + accountability partner.',
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

  useEffect(() => {
    fetchAdminCohorts().then(c => setCohorts(c.filter(x => x.status === 'active').map(x => ({ id: x.id, name: x.name }))))
  }, [])

  const path = PATHS.find(p => p.id === pathId) ?? PATHS[0]

  function start() {
    setPreview({
      path: pathId,
      dayOverride: day,
      cohortId: pathId === 'C' ? (cohortId || null) : null,
      startedAt: Date.now(),
    })
    // For Seal the Leak the today page already supports ?day=N — pass it
    // along so the admin lands directly on the chosen day.
    const target = pathId === 'A' ? `${path.home}?day=${day}` : path.home
    router.push(target)
  }

  function stop() {
    setPreview(null)
  }

  const S = {
    h1: { fontSize: 20, fontWeight: 700, color: 'var(--ink)', margin: 0 },
    sub: { fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: 12,
      marginBottom: 20,
    } as const,
    card: (on: boolean, accent: string, accentBg: string) => ({
      background: on ? accentBg : '#fff',
      border: `1px solid ${on ? accent : 'var(--line)'}`,
      borderLeft: `4px solid ${accent}`,
      borderRadius: 12,
      padding: 16,
      cursor: 'pointer',
      transition: 'background 0.15s ease, border-color 0.15s ease',
    } as const),
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
      <div style={{ marginBottom: 18 }}>
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
          <span>{PATHS.find(p => p.id === preview.path)?.title}{preview.dayOverride ? ` · Day ${preview.dayOverride}` : ''}</span>
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
        background: '#fff', border: '1px solid var(--line)', borderRadius: 12,
        padding: 16, marginBottom: 18,
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
            {pathId === 'B' && 'Used as a hint — actual day comes from the user’s signup date.'}
            {pathId === 'C' && 'Cohort phase / week reference.'}
          </p>
        </div>
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
