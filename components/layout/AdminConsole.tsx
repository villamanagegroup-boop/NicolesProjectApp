'use client'
import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { supabaseClient } from '@/lib/supabase/client'
import { PATHS, type PathId } from '@/data/paths'

// Single admin drawer that groups every in-app admin lever the app
// has today — view-as preview, day/archetype overrides, feature
// jump-list, and an inline cohort creator. Opens from the Topbar
// "Admin" button (rendered only when user.isAdmin).

interface Props { open: boolean; onClose: () => void }

const ARCHETYPES: { id: string; label: string; tint: string }[] = [
  { id: 'door',   label: 'The Open Door',          tint: '#3D3080' },
  { id: 'throne', label: 'The Overthink Throne',   tint: '#1a1a2e' },
  { id: 'engine', label: 'The Interrupted Engine', tint: '#7B1D1D' },
  { id: 'push',   label: 'The Pushthrough',        tint: '#3d2c0e' },
]

const FEATURE_LINKS: { href: string; label: string; sub: string }[] = [
  { href: '/dashboard',          label: 'Dashboard',          sub: 'Cards entry page' },
  { href: '/card',               label: 'Today\'s Card',      sub: 'Current day card' },
  { href: '/past',               label: 'Past cards',         sub: 'Timeline of completed days' },
  { href: '/vault',              label: 'The Vault',          sub: 'Day 30+ unlocks' },
  { href: '/journal',            label: 'Reflection',         sub: 'Journal entries list' },
  { href: '/wins',               label: 'My Wins',            sub: 'Logged victories' },
  { href: '/profile',            label: 'Self',               sub: 'Reflections + progress' },
  { href: '/program',            label: 'Seal the Leak',      sub: 'Program overview' },
  { href: '/program/today',      label: 'Today\'s Session',   sub: 'Current work day' },
  { href: '/program/reflections',label: 'Daily Journal',      sub: 'Program reflection archive' },
  { href: '/program/progress',   label: 'My Progress',        sub: 'Work completion state' },
  { href: '/circle',             label: 'The Circle',         sub: 'Cohort dashboard' },
  { href: '/circle/welcome',     label: 'Circle welcome',     sub: 'Post-enrollment orientation' },
  { href: '/circle/intake',      label: 'Circle intake',      sub: '4-step profile completion' },
  { href: '/circle/community',   label: 'Community feed',     sub: 'Cohort posts' },
  { href: '/circle/partner',     label: 'Partner thread',     sub: 'Accountability DMs' },
  { href: '/circle/calls',       label: 'Live calls',         sub: 'Zoom schedule + replays' },
  { href: '/upgrade',            label: 'Upgrade',            sub: 'Paths the user hasn\'t bought yet' },
  { href: '/quiz',               label: 'Quiz',               sub: 'Archetype assessment' },
  { href: '/onboarding',         label: 'Onboarding',         sub: '5-step assessment flow' },
  { href: '/settings',           label: 'Settings',           sub: 'Plan + preferences' },
]

export default function AdminConsole({ open, onClose }: Props) {
  const router = useRouter()
  const {
    user,
    viewAsPath, setViewAsPath,
    adminCardDay, setAdminCardDay,
    adminProgramDay, setAdminProgramDay,
    adminArchetype, setAdminArchetype,
    realDayNumber,
  } = useApp()

  // Local form state for cohort creation.
  const [cohortName, setCohortName] = useState('')
  const [cohortStart, setCohortStart] = useState('')
  const [cohortEnd, setCohortEnd] = useState('')
  const [cohortMax, setCohortMax] = useState(16)
  const [creating, setCreating] = useState(false)
  const [cohortMsg, setCohortMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  // Ephemeral toast ("Saved — View set to Path A") that auto-dismisses 2s
  // after any override change. Gives the admin a clear signal that their
  // choice is already live in the app.
  const [toast, setToast] = useState<string | null>(null)
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(t)
  }, [toast])

  // Wrapped setters — update state AND announce what just changed.
  function applyViewAs(next: PathId | null) {
    setViewAsPath(next)
    setToast(next === null ? 'Back to admin view' : `Viewing as Path ${next}`)
  }
  function applyCardDay(next: number | null) {
    setAdminCardDay(next)
    setToast(next === null ? 'Card day override cleared' : `Card day set to ${next}`)
  }
  function applyProgramDay(next: number | null) {
    setAdminProgramDay(next)
    setToast(next === null ? 'Program day override cleared' : `Program day set to ${next}`)
  }
  function applyArchetype(next: string | null) {
    setAdminArchetype(next)
    if (next === null) setToast('Archetype back to default')
    else {
      const label = ARCHETYPES.find(a => a.id === next)?.label ?? next
      setToast(`Archetype set to ${label}`)
    }
  }

  // Lock body scroll while drawer is open.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  // Guard against SSR — createPortal needs document. Also defer the first
  // portal render so the "open" transition animates in instead of popping.
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!user.isAdmin) return null
  if (!mounted) return null

  async function createCohort() {
    if (!cohortName.trim() || !cohortStart || !cohortEnd) {
      setCohortMsg({ kind: 'err', text: 'Name, start date, and end date are required.' })
      return
    }
    setCreating(true)
    setCohortMsg(null)
    const { error } = await supabaseClient.from('circle_cohorts').insert({
      name: cohortName.trim(),
      starts_at: cohortStart,
      ends_at: cohortEnd,
      max_members: cohortMax,
      is_active: false,
    })
    setCreating(false)
    if (error) {
      setCohortMsg({ kind: 'err', text: error.message })
    } else {
      setCohortMsg({ kind: 'ok', text: `Created. Activate it in /admin/circle when ready.` })
      setCohortName(''); setCohortStart(''); setCohortEnd(''); setCohortMax(16)
    }
  }

  function resetAll() {
    setViewAsPath(null)
    setAdminCardDay(null)
    setAdminProgramDay(null)
    setAdminArchetype(null)
    setToast('All overrides cleared')
  }

  function jumpTo(href: string) {
    onClose()
    router.push(href)
  }

  const hasOverrides = viewAsPath !== null
                    || adminCardDay !== null
                    || adminProgramDay !== null
                    || adminArchetype !== null

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: open ? 'rgba(12,12,10,0.4)' : 'transparent',
          zIndex: 9000,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'background 0.2s ease',
        }}
      />

      {/* Drawer */}
      <aside style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(420px, 92vw)',
        background: '#fff',
        borderLeft: '1px solid var(--line-md)',
        zIndex: 9001,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.28s cubic-bezier(0.32,0,0.15,1)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 22px',
          borderBottom: '1px solid var(--line)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--paper)',
        }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', margin: '0 0 4px' }}>
              Admin
            </p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 400, color: 'var(--ink)', margin: 0 }}>
              Walkthrough console
            </h2>
          </div>
          <button onClick={onClose} style={closeBtn} aria-label="Close admin console">✕</button>
        </div>

        {/* Sticky status strip — always shows the current applied state */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 1,
          padding: '12px 22px',
          background: hasOverrides ? 'rgba(184,146,42,0.08)' : 'var(--paper)',
          borderBottom: `1px solid ${hasOverrides ? 'rgba(184,146,42,0.3)' : 'var(--line)'}`,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            gap: 10,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                color: hasOverrides ? 'var(--gold)' : 'var(--text-muted)',
                margin: '0 0 4px',
              }}>
                {hasOverrides ? 'Applied to your app' : 'Current view'}
              </p>
              {hasOverrides ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {viewAsPath !== null && <StatusChip label={`View: Path ${viewAsPath}`} />}
                  {adminCardDay !== null && <StatusChip label={`Card day: ${adminCardDay}`} />}
                  {adminProgramDay !== null && <StatusChip label={`Program day: ${adminProgramDay}`} />}
                  {adminArchetype !== null && <StatusChip label={`Archetype: ${ARCHETYPES.find(a => a.id === adminArchetype)?.label ?? adminArchetype}`} />}
                </div>
              ) : (
                <p style={{ fontSize: 12, color: 'var(--text-soft)', margin: 0 }}>
                  Admin view · no overrides active
                </p>
              )}
            </div>
            {hasOverrides && (
              <button onClick={resetAll} style={smallBtn}>Reset all</button>
            )}
          </div>
        </div>

        {/* Toast — slides down from under the header, auto-dismisses */}
        <div
          aria-live="polite"
          style={{
            position: 'absolute',
            top: 70, left: '50%',
            transform: `translate(-50%, ${toast ? '0' : '-20px'})`,
            opacity: toast ? 1 : 0,
            transition: 'opacity .2s ease, transform .2s ease',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          {toast && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 14px', borderRadius: 999,
              background: 'var(--green)', color: '#fff',
              fontSize: 12, fontWeight: 600,
              boxShadow: '0 4px 12px rgba(12,12,10,0.15)',
              fontFamily: 'var(--font-body)',
              whiteSpace: 'nowrap',
            }}>
              <span>✓</span>
              {toast}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* View as */}
          <Section title="View as" sub="Preview the app as a user on any path.">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <ChoiceBtn
                active={viewAsPath === null}
                onClick={() => applyViewAs(null)}
                label="Admin view"
                sub="Full access"
              />
              {(['A','B','C'] as PathId[]).map(id => (
                <ChoiceBtn
                  key={id}
                  active={viewAsPath === id}
                  onClick={() => applyViewAs(id)}
                  label={`${PATHS[id].icon} Path ${id}`}
                  sub={PATHS[id].shortTitle}
                />
              ))}
            </div>
          </Section>

          {/* Card day override */}
          <Section title="Daily Card day" sub={`Real day: ${realDayNumber}. Override to jump anywhere.`}>
            <DayControl
              value={adminCardDay}
              max={365}
              realValue={realDayNumber}
              onChange={applyCardDay}
              quick={[1, 6, 7, 30, 90, 180, 365]}
            />
          </Section>

          {/* Program day override */}
          <Section title="Seal the Leak day" sub="7-day reset. Override to preview any day.">
            <DayControl
              value={adminProgramDay}
              max={7}
              realValue={null}
              onChange={applyProgramDay}
              quick={[1, 2, 3, 4, 5, 6, 7]}
            />
          </Section>

          {/* Archetype */}
          <Section title="Seal the Leak archetype" sub="Preview any of the four program routes.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <ChoiceBtn
                active={adminArchetype === null}
                onClick={() => applyArchetype(null)}
                label="Default"
                sub="Derived from quiz result"
              />
              {ARCHETYPES.map(a => (
                <ChoiceBtn
                  key={a.id}
                  active={adminArchetype === a.id}
                  onClick={() => applyArchetype(a.id)}
                  label={a.label}
                  sub={`Preview ${a.id} route`}
                  accent={a.tint}
                />
              ))}
            </div>
          </Section>

          {/* Features / quick nav */}
          <Section title="Jump to a feature" sub="All reachable pages. Great for a full walkthrough.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {FEATURE_LINKS.map(f => (
                <button
                  key={f.href}
                  onClick={() => jumpTo(f.href)}
                  style={featureRow}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--paper)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fff' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{f.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{f.sub}</div>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>→</span>
                </button>
              ))}
            </div>
          </Section>

          {/* Create cohort */}
          <Section title="Create a new cohort" sub="Inserts an inactive cohort row. Activate it in /admin/circle.">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Field label="Name" full>
                <input
                  value={cohortName}
                  onChange={e => setCohortName(e.target.value)}
                  placeholder="Cohort 2 — Summer 2026"
                  style={inputStyle}
                />
              </Field>
              <Field label="Starts">
                <input type="date" value={cohortStart} onChange={e => setCohortStart(e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Ends">
                <input type="date" value={cohortEnd} onChange={e => setCohortEnd(e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Max members" full>
                <input type="number" min={1} value={cohortMax} onChange={e => setCohortMax(parseInt(e.target.value || '0', 10))} style={inputStyle} />
              </Field>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
              <button
                onClick={createCohort}
                disabled={creating}
                style={{
                  ...primaryBtn,
                  background: creating ? 'var(--paper3)' : 'var(--ink)',
                  cursor: creating ? 'not-allowed' : 'pointer',
                }}
              >
                {creating ? 'Creating…' : 'Create cohort'}
              </button>
              <Link href="/admin/circle" onClick={onClose} style={{ textDecoration: 'none' }}>
                <button style={ghostBtn}>Manage cohorts →</button>
              </Link>
            </div>
            {cohortMsg && (
              <p style={{
                fontSize: 11, marginTop: 8,
                color: cohortMsg.kind === 'ok' ? 'var(--green)' : 'var(--red)',
              }}>
                {cohortMsg.text}
              </p>
            )}
          </Section>

        </div>
      </aside>
    </>,
    document.body,
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatusChip({ label }: { label: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 600,
      padding: '3px 9px', borderRadius: 999,
      background: '#fff',
      border: '1px solid rgba(184,146,42,0.35)',
      color: 'var(--ink)',
      fontFamily: 'var(--font-body)',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 4px' }}>
        {title}
      </p>
      {sub && <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 10px', lineHeight: 1.5 }}>{sub}</p>}
      {children}
    </div>
  )
}

function ChoiceBtn({ active, onClick, label, sub, accent }: {
  active: boolean; onClick: () => void; label: string; sub?: string; accent?: string
}) {
  const tint = accent ?? 'var(--gold)'
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
        padding: '8px 12px',
        borderRadius: 8,
        border: `1px solid ${active ? tint : 'var(--line-md)'}`,
        background: active ? 'rgba(184,146,42,0.08)' : '#fff',
        cursor: 'pointer', fontFamily: 'var(--font-body)',
        textAlign: 'left',
      }}
    >
      <span style={{ fontSize: 12, fontWeight: active ? 600 : 500, color: active ? tint : 'var(--ink)' }}>
        {label}
      </span>
      {sub && <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</span>}
    </button>
  )
}

function DayControl({ value, max, realValue, onChange, quick }: {
  value: number | null
  max: number
  realValue: number | null
  onChange: (v: number | null) => void
  quick: number[]
}) {
  const effective = value ?? realValue ?? 1
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input
          type="number"
          min={1} max={max}
          value={value ?? ''}
          onChange={e => {
            const n = parseInt(e.target.value, 10)
            onChange(isNaN(n) ? null : Math.max(1, Math.min(max, n)))
          }}
          placeholder={realValue !== null ? String(realValue) : 'any'}
          style={{ ...inputStyle, width: 80 }}
        />
        <input
          type="range"
          min={1} max={max}
          value={effective}
          onChange={e => onChange(parseInt(e.target.value, 10))}
          style={{ flex: 1, accentColor: 'var(--gold)' }}
        />
        {value !== null && (
          <button onClick={() => onChange(null)} style={smallBtn}>Clear</button>
        )}
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {quick.map(d => (
          <button
            key={d}
            onClick={() => onChange(d)}
            style={{
              fontSize: 10, fontWeight: 600,
              padding: '3px 8px', borderRadius: 999,
              border: `1px solid ${value === d ? 'var(--gold)' : 'var(--line-md)'}`,
              background: value === d ? 'rgba(184,146,42,0.1)' : '#fff',
              color: value === d ? 'var(--gold)' : 'var(--text-soft)',
              cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}
          >
            Day {d}
          </button>
        ))}
      </div>
    </div>
  )
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : undefined }}>
      <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 4 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const closeBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--text-soft)', fontSize: 18,
  padding: 4, lineHeight: 1,
  fontFamily: 'inherit',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '7px 10px',
  fontSize: 12,
  fontFamily: 'var(--font-body)',
  border: '1px solid var(--line-md)',
  borderRadius: 6,
  outline: 'none',
  boxSizing: 'border-box',
  background: '#fff',
}

const smallBtn: React.CSSProperties = {
  fontSize: 10, fontWeight: 600,
  padding: '4px 10px', borderRadius: 6,
  background: '#fff', border: '1px solid var(--line-md)',
  color: 'var(--text-soft)',
  cursor: 'pointer', fontFamily: 'var(--font-body)',
}

const primaryBtn: React.CSSProperties = {
  background: 'var(--ink)', color: '#fff',
  padding: '8px 18px', borderRadius: 8,
  fontSize: 12, fontWeight: 600,
  border: 'none', cursor: 'pointer',
  fontFamily: 'var(--font-body)',
}

const ghostBtn: React.CSSProperties = {
  background: '#fff', border: '1px solid var(--line-md)',
  color: 'var(--text-soft)',
  padding: '8px 14px', borderRadius: 8,
  fontSize: 12, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'var(--font-body)',
}

const featureRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '8px 10px', borderRadius: 6,
  border: 'none', background: '#fff',
  cursor: 'pointer', textAlign: 'left',
  fontFamily: 'var(--font-body)',
  transition: 'background .1s',
}
