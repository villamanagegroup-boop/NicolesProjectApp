'use client'

// app/(admin)/admin/sitemap/page.tsx
// Site map — every page in the app with a click-to-open button.
// Useful for admins who want to walk the user experience without
// hunting for URLs, or QA-check that everything still loads.

import Link from 'next/link'
import { useState } from 'react'

type Access = 'admin' | 'user' | 'public'

interface Route {
  path: string
  title: string
  desc: string
  access: Access
  dynamic?: boolean   // route uses [id] / [week] / etc
  exampleHint?: string  // for dynamic routes — what kind of value is needed
}

interface Section {
  key: string
  title: string
  desc: string
  routes: Route[]
}

const SECTIONS: Section[] = [
  {
    key: 'portal-shared',
    title: 'User portal — universal',
    desc: 'Pages every signed-in user sees regardless of program.',
    routes: [
      { path: '/dashboard',  access: 'user', title: 'Home (dashboard)', desc: 'Universal home — sneak peeks across every program the user owns. Daily check-in lives here. Latest sidebar surfaces announcements / live calls / coach DMs for Circle members.' },
      { path: '/journal',    access: 'user', title: 'Journal',          desc: 'Universal daily journal. Prompt rotates daily by signup-anchored day, looped at 365. Backed by daily_cards.journal_prompt under the hood.' },
      { path: '/wins',       access: 'user', title: 'Wins',             desc: 'Log boundaries, choices, moments, growth wins. Cross-program.' },
      { path: '/profile',    access: 'user', title: 'Profile',          desc: 'Avatar, bio, theme compass, full reflections archive (every journal entry kept on file).' },
      { path: '/settings',   access: 'user', title: 'Settings',         desc: 'Account, password, preferences.' },
      { path: '/upgrade',    access: 'user', title: 'Upgrade',          desc: 'Locked-path landing — pricing for programs the user does not yet own.' },
      { path: '/take-the-quiz',  access: 'user', title: 'Take-the-quiz failsafe', desc: 'Friendly landing for users who reached a program without a quiz_result. Two CTAs: standalone quiz or email Nicole.' },
      { path: '/quiz/standalone', access: 'user', title: 'Standalone quiz',         desc: '12 questions for already-signed-in users. Writes archetype to user row, then redirects to their dashboard.' },
    ],
  },
  {
    key: 'portal-pathA',
    title: 'User portal — Path A (Seal the Leak)',
    desc: '7-day program. All pages render content for the user\'s archetype track (door / throne / engine / push). Path B users without the cards add-on cannot reach these routes — the portal layout redirects to /upgrade.',
    routes: [
      { path: '/program',             access: 'user', title: 'Program home',          desc: '7-day journey overview, archetype-specific.' },
      { path: '/program/today',       access: 'user', title: 'Today\'s session',      desc: 'Current day\'s prompts and exercises. Saves answers to localStorage by route + day + item.' },
      { path: '/program/progress',    access: 'user', title: 'Progress',              desc: 'Completion grid for all 7 days.' },
      { path: '/program/reflections', access: 'user', title: 'Reflections',           desc: 'Review past program prompts. Seal-only — no longer shows universal journal entries.' },
    ],
  },
  {
    key: 'portal-pathB',
    title: 'User portal — Path B (365 Cards)',
    desc: 'Daily Alignment cards. Reachable by Path B users always, and by Path A users with the cards add-on (cards_addon_started_at).',
    routes: [
      { path: '/cards', access: 'user', title: 'Your daily cards', desc: 'Path B home — today\'s card preview + affirmation + streak + recent strip (5 slots, dashed outlines for upcoming days).' },
      { path: '/card',  access: 'user', title: 'Today\'s card',    desc: 'The current daily card with journal prompt and reflection editor. Day nav lets users jump back through past cards.' },
      { path: '/past',  access: 'user', title: 'Past cards',       desc: 'Compact grid of every unlocked past card (auto-fill at minmax 110px). Filter by theme.' },
      { path: '/vault', access: 'user', title: 'Vault',            desc: 'Long-term archive — the user\'s earliest cards. Locked until Day 30; before that, shows a progress ring.' },
    ],
  },
  {
    key: 'portal-pathC',
    title: 'User portal — Path C (The Circle)',
    desc: '90-day cohort coaching experience.',
    routes: [
      { path: '/circle',           access: 'user', title: 'Circle home',     desc: 'Cohort dashboard — current week, archetype track.' },
      { path: '/circle/intake',    access: 'user', title: 'Intake',          desc: 'Onboarding assessment (required for Circle access).' },
      { path: '/circle/welcome',   access: 'user', title: 'Welcome',         desc: 'First-visit welcome page.' },
      { path: '/circle/week/[week]', access: 'user', title: 'Week view',     desc: 'Specific week\'s teaching + journal prompts.', dynamic: true, exampleHint: 'append a week number, e.g. /circle/week/3' },
      { path: '/circle/calls',     access: 'user', title: 'Live calls',      desc: 'Upcoming + past call schedule and replays.' },
      { path: '/circle/community', access: 'user', title: 'Community',       desc: 'Cohort-wide post feed.' },
      { path: '/circle/partner',   access: 'user', title: 'Partner',         desc: 'Direct messages with accountability partner.' },
      { path: '/circle/coach',     access: 'user', title: 'Coach chat',      desc: '1:1 messages with Nicole.' },
    ],
  },
  {
    key: 'auth-quiz',
    title: 'Auth & quiz funnel',
    desc: 'Public-facing pages: landing, quiz, signup.',
    routes: [
      { path: '/',             access: 'public', title: 'Landing page',  desc: 'Marketing home.' },
      { path: '/choose-path',  access: 'public', title: 'Choose path',   desc: 'Direct path comparison (alternate to quiz).' },
      { path: '/quiz',         access: 'public', title: 'Quiz',          desc: '12-question archetype quiz.' },
      { path: '/quiz/submit',  access: 'public', title: 'Quiz lead capture', desc: 'Name + email gate before reveal.' },
      { path: '/quiz/result',  access: 'public', title: 'Quiz result',   desc: 'Shows the archetype reveal.' },
      { path: '/quiz/paths',   access: 'public', title: 'Quiz paths',    desc: 'Three program comparison after quiz.' },
      { path: '/login',        access: 'public', title: 'Log in',        desc: 'Email + password sign in.' },
      { path: '/signup?path=A', access: 'public', title: 'Sign up',       desc: 'Post-payment account creation. Requires ?path=A|B|C to render — Stripe success URLs hand the path back. Admins can preview the form here even when signed in.' },
      { path: '/onboarding',   access: 'public', title: 'Onboarding',    desc: 'Path C cohort enrollment intake.' },
    ],
  },
  {
    key: 'welcome',
    title: 'Post-payment welcome pages',
    desc: 'Landing pages after Stripe checkout for each program.',
    routes: [
      { path: '/welcome/cards',         access: 'public', title: '365 Cards welcome',   desc: 'After buying Path B.' },
      { path: '/welcome/seal-the-leak', access: 'public', title: 'Seal the Leak welcome', desc: 'After buying Path A.' },
      { path: '/welcome/the-circle',    access: 'public', title: 'The Circle welcome',  desc: 'After buying Path C.' },
    ],
  },
]

const ACCESS_TINT: Record<Access, { bg: string; fg: string; border: string; label: string }> = {
  admin:  { bg: 'rgba(184,40,40,0.08)',  fg: 'var(--red)',   border: 'rgba(184,40,40,0.25)', label: 'Admin' },
  user:   { bg: 'rgba(31,92,58,0.10)',   fg: 'var(--green)', border: 'rgba(31,92,58,0.25)',  label: 'User' },
  public: { bg: 'rgba(184,146,42,0.10)', fg: 'var(--gold)',  border: 'var(--gold-line)',     label: 'Public' },
}

export default function SitemapPage() {
  const [search, setSearch] = useState('')
  const [accessFilter, setAccessFilter] = useState<Access | 'all'>('all')
  const [copiedPath, setCopiedPath] = useState<string | null>(null)

  const q = search.trim().toLowerCase()

  const filteredSections = SECTIONS
    .map(sec => ({
      ...sec,
      routes: sec.routes.filter(r => {
        if (accessFilter !== 'all' && r.access !== accessFilter) return false
        if (!q) return true
        return r.path.toLowerCase().includes(q)
            || r.title.toLowerCase().includes(q)
            || r.desc.toLowerCase().includes(q)
      }),
    }))
    .filter(sec => sec.routes.length > 0)

  const totalRoutes = SECTIONS.reduce((n, s) => n + s.routes.length, 0)
  const visibleRoutes = filteredSections.reduce((n, s) => n + s.routes.length, 0)

  function copyPath(path: string) {
    const fullUrl = window.location.origin + path
    navigator.clipboard.writeText(fullUrl).catch(() => {})
    setCopiedPath(path)
    setTimeout(() => setCopiedPath(curr => curr === path ? null : curr), 1200)
  }

  return (
    <div style={{ color: 'var(--ink)' }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', margin: '0 0 4px' }}>Site map</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 12px' }}>
          Every user-facing page — portal, marketing, quiz funnel, welcome flows.
          {' '}{visibleRoutes} of {totalRoutes} shown. Admin tools live in the sidebar.
        </p>
        <div style={{
          background: 'var(--paper2)', border: '1px solid var(--line)',
          borderRadius: 10, padding: '10px 14px',
          fontSize: 12, color: 'var(--text-soft)', lineHeight: 1.6,
        }}>
          <strong style={{ color: 'var(--ink)' }}>Access reminder:</strong> the portal layout enforces path
          isolation — Path A sees /program + (with add-on) /cards routes, Path B sees /cards routes,
          Path C sees /circle. Admins bypass these guards and can open any page directly. To experience
          a page <em>as a specific member</em>, use{' '}
          <Link href="/admin/preview" style={{ color: 'var(--gold)' }}>Preview as user</Link>.
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
        marginBottom: 18,
      }}>
        <input
          placeholder="Search by path, title, or description…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: '1 1 240px', minWidth: 200,
            background: '#fff', border: '1px solid var(--line-md)', borderRadius: 8,
            padding: '8px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit',
          }}
        />
        {(['all', 'user', 'public'] as const).map(opt => {
          const on = accessFilter === opt
          const tint = opt === 'all'
            ? { bg: '#fff', fg: 'var(--text-muted)', border: 'var(--line)', label: 'All' }
            : ACCESS_TINT[opt]
          return (
            <button
              key={opt}
              onClick={() => setAccessFilter(opt)}
              style={{
                fontSize: 11, fontWeight: 600,
                padding: '7px 12px', borderRadius: 999,
                background: on ? tint.fg : tint.bg,
                color: on ? '#fff' : tint.fg,
                border: `1px solid ${tint.border}`,
                cursor: 'pointer', fontFamily: 'inherit',
                textTransform: 'capitalize',
              }}
            >
              {tint.label}
            </button>
          )
        })}
      </div>

      {/* Sections */}
      {filteredSections.length === 0 ? (
        <div style={{
          background: '#fff', border: '1px solid var(--line)', borderRadius: 12,
          padding: 32, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)',
        }}>
          No pages match.
        </div>
      ) : (
        filteredSections.map(sec => (
          <div key={sec.key} style={{ marginBottom: 24 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '.1em',
              textTransform: 'uppercase', color: 'var(--text-muted)',
              marginBottom: 6, paddingBottom: 6, borderBottom: '1px solid var(--line)',
              display: 'flex', justifyContent: 'space-between',
            }}>
              <span>{sec.title} ({sec.routes.length})</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 10px' }}>{sec.desc}</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 8 }}>
              {sec.routes.map(r => {
                const tint = ACCESS_TINT[r.access]
                return (
                  <div
                    key={r.path}
                    style={{
                      background: '#fff', border: '1px solid var(--line)', borderRadius: 10,
                      padding: '10px 12px',
                      display: 'flex', flexDirection: 'column', gap: 6,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', flex: '1 1 auto' }}>
                        {r.title}
                      </span>
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase',
                        padding: '2px 6px', borderRadius: 999,
                        background: tint.bg, color: tint.fg, border: `1px solid ${tint.border}`,
                        flexShrink: 0,
                      }}>{tint.label}</span>
                      {r.dynamic && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase',
                          padding: '2px 6px', borderRadius: 999,
                          background: 'rgba(0,0,0,0.06)', color: 'var(--text-muted)',
                          border: '1px solid var(--line)', flexShrink: 0,
                        }}>Dynamic</span>
                      )}
                    </div>

                    <code style={{
                      fontSize: 11, color: 'var(--text-soft)',
                      fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{r.path}</code>

                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
                      {r.desc}
                      {r.dynamic && r.exampleHint && (
                        <span style={{ display: 'block', marginTop: 3, fontStyle: 'italic', fontSize: 11 }}>
                          ↪ {r.exampleHint}
                        </span>
                      )}
                    </p>

                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      {!r.dynamic ? (
                        <>
                          <Link
                            href={r.path}
                            style={{
                              fontSize: 11, fontWeight: 600,
                              padding: '5px 10px', borderRadius: 6,
                              background: 'var(--green)', color: '#fff',
                              textDecoration: 'none', fontFamily: 'inherit',
                            }}
                          >
                            Open →
                          </Link>
                          <a
                            href={r.path}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: 11, fontWeight: 600,
                              padding: '5px 10px', borderRadius: 6,
                              background: '#fff', color: 'var(--text-soft)',
                              textDecoration: 'none', fontFamily: 'inherit',
                              border: '1px solid var(--line-md)',
                            }}
                          >
                            New tab ↗
                          </a>
                        </>
                      ) : (
                        <span style={{
                          fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic',
                          padding: '5px 10px',
                        }}>
                          Needs a parameter to open directly
                        </span>
                      )}
                      <button
                        onClick={() => copyPath(r.path)}
                        style={{
                          fontSize: 11, fontWeight: 600,
                          padding: '5px 10px', borderRadius: 6,
                          background: '#fff', color: 'var(--text-muted)',
                          border: '1px solid var(--line-md)', cursor: 'pointer',
                          fontFamily: 'inherit', marginLeft: 'auto',
                        }}
                      >
                        {copiedPath === r.path ? '✓ copied' : 'Copy URL'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}

      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 18, lineHeight: 1.6 }}>
        Note: opening a user-portal page as an admin works because admins bypass path/onboarding guards.
        To experience the page <em>as a specific user</em> (their day count, their cohort, their archetype),
        use <Link href="/admin/preview" style={{ color: 'var(--gold)' }}>Preview as user</Link> instead.
      </p>
    </div>
  )
}
