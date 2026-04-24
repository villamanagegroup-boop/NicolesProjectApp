'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'

// One dropdown entry per program the user can enter. The current program
// shows as a pill on the Topbar; the dropdown lists all accessible programs
// plus (optionally) upgrade prompts for ones the user hasn't bought yet.

type Mode = 'cards' | 'work' | 'circle'

type Program = {
  mode: Mode
  title: string
  short: string
  href: string
  accent: string
  accentPale: string
  Icon: React.ComponentType
}

function CardsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="12" height="9" rx="1.5" />
      <path d="M4 5V4a2 2 0 012-2h4a2 2 0 012 2v1" />
    </svg>
  )
}
function WorkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2a6 6 0 016 6v2l1 2H1l1-2V8a6 6 0 016-6z" />
      <path d="M6.5 14a1.5 1.5 0 003 0" />
    </svg>
  )
}
function CircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  )
}

const PROGRAMS: Record<Mode, Program> = {
  cards:  { mode: 'cards',  title: '365 Days',      short: 'Daily Alignment', href: '/dashboard', accent: 'var(--green)', accentPale: 'var(--green-pale)',            Icon: CardsIcon  },
  work:   { mode: 'work',   title: 'Seal the Leak', short: '7-Day Reset',     href: '/program',   accent: '#3D3080',      accentPale: 'rgba(61,48,128,0.08)',          Icon: WorkIcon   },
  circle: { mode: 'circle', title: 'The Circle',    short: '90-Day Cohort',   href: '/circle',    accent: '#C97D3A',      accentPale: 'rgba(201,125,58,0.08)',         Icon: CircleIcon },
}

export default function ProgramSwitcher() {
  const router = useRouter()
  const { loading, sidebarMode, setSidebarMode, hasCardsAccess, hasWorkAccess, hasCircleAccess } = useApp()
  const [open, setOpen] = useState(false)

  // Don't render during load — mockUser grants all access and then
  // collapses when the real user row arrives, causing a flash.
  if (loading) return null

  const access: Record<Mode, boolean> = {
    cards:  hasCardsAccess,
    work:   hasWorkAccess,
    circle: hasCircleAccess,
  }
  const accessibleCount = (hasCardsAccess ? 1 : 0) + (hasWorkAccess ? 1 : 0) + (hasCircleAccess ? 1 : 0)

  // Only render the switcher when the user has more than one program to pick from.
  if (accessibleCount < 2) return null

  const current = PROGRAMS[sidebarMode]
  const CurrentIcon = current.Icon

  function selectProgram(mode: Mode) {
    setSidebarMode(mode)
    router.push(PROGRAMS[mode].href)
    setOpen(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        title={`Current program: ${current.title}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          borderRadius: 999,
          border: `1px solid ${current.accent}`,
          background: current.accentPale,
          color: current.accent,
          fontSize: 12,
          fontWeight: 600,
          fontFamily: 'var(--font-body)',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        <CurrentIcon />
        <span className="hide-mobile">{current.title}</span>
        <span style={{ fontSize: 9, opacity: 0.7 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            minWidth: 240,
            background: '#fff',
            border: '1px solid var(--line-md)',
            borderRadius: 10,
            boxShadow: '0 4px 16px rgba(12,12,10,0.08)',
            zIndex: 50,
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '8px 14px',
              fontSize: 9,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              background: 'var(--paper)',
              borderBottom: '1px solid var(--line)',
              fontFamily: 'var(--font-body)',
            }}>
              Your programs
            </div>
            {(['cards', 'work', 'circle'] as Mode[])
              .filter(m => access[m])
              .map(m => {
                const p = PROGRAMS[m]
                const Icon = p.Icon
                const active = sidebarMode === m
                return (
                  <button
                    key={m}
                    onClick={() => selectProgram(m)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      width: '100%',
                      padding: '12px 14px',
                      background: active ? p.accentPale : '#fff',
                      border: 'none',
                      borderBottom: '1px solid var(--line)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'var(--font-body)',
                    }}
                    onMouseEnter={e => {
                      if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'var(--paper)'
                    }}
                    onMouseLeave={e => {
                      if (!active) (e.currentTarget as HTMLButtonElement).style.background = '#fff'
                    }}
                  >
                    <span style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: p.accentPale, color: p.accent,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: active ? 600 : 500, color: active ? p.accent : 'var(--ink)' }}>
                        {p.title}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                        {p.short}
                      </div>
                    </div>
                    {active && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: p.accent, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        Current
                      </span>
                    )}
                  </button>
                )
              })}
          </div>
        </>
      )}
    </div>
  )
}
