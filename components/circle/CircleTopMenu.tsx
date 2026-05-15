'use client'

// components/circle/CircleTopMenu.tsx
// Horizontal "Also in The Circle" nav strip that sits at the top of every
// Circle page. Mounted by app/(portal)/circle/layout.tsx; hidden on the
// onboarding/intake flows where a focused, single-screen UI is wanted.
//
// The link to "All weeks" points to the caller's current week when known
// (so it acts as a "this week" shortcut from any other page), falling back
// to Week 1 before the cohort has started.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import { getMyCircleMember, getCurrentWeekNumber } from '@/lib/circle'

const ORANGE      = '#B8862E'
const ORANGE_DEEP = '#8c6520'
const ORANGE_PALE = '#fdf6f2'
const ORANGE_TINT = 'rgba(184,134,46,0.08)'

interface MenuItem {
  href: string
  label: string
  icon: React.ReactNode
  matches: (path: string) => boolean
}

export default function CircleTopMenu() {
  const pathname = usePathname() ?? ''
  const [currentWeek, setCurrentWeek] = useState<number | null>(null)

  // Resolve the caller's current week so the "All weeks" pill jumps them
  // to where the cohort actually is. Fire-and-forget — the menu still
  // renders before this resolves; the link falls back to Week 1.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const m = await getMyCircleMember()
      if (!m || cancelled) return
      const { data } = await supabaseClient
        .from('circle_cohorts')
        .select('starts_at')
        .eq('id', m.cohort_id)
        .maybeSingle()
      if (cancelled || !data) return
      setCurrentWeek(getCurrentWeekNumber(data.starts_at as string))
    })()
    return () => { cancelled = true }
  }, [])

  const items: MenuItem[] = [
    {
      href: '/circle',
      label: 'Your Circle',
      icon: <CircleIcon />,
      matches: p => p === '/circle',
    },
    {
      href: '/circle/community',
      label: 'Community',
      icon: <CommunityIcon />,
      matches: p => p.startsWith('/circle/community'),
    },
    {
      href: `/circle/week/${currentWeek ?? 1}`,
      label: 'This week',
      icon: <BookIcon />,
      matches: p => p.startsWith('/circle/week'),
    },
    {
      href: '/circle/calls',
      label: 'Live calls',
      icon: <CallIcon />,
      matches: p => p.startsWith('/circle/calls'),
    },
    {
      href: '/circle/partner',
      label: 'Partner',
      icon: <PartnerIcon />,
      matches: p => p.startsWith('/circle/partner'),
    },
  ]

  return (
    <nav
      aria-label="Circle navigation"
      style={{
        position: 'relative',
        display: 'flex', alignItems: 'center', gap: 4,
        padding: 6,
        background: `linear-gradient(135deg, ${ORANGE_PALE} 0%, #ffffff 60%)`,
        border: '1px solid var(--line)',
        borderRadius: 999,
        boxShadow: '0 1px 2px rgba(12,12,10,0.04), 0 6px 18px -8px rgba(184,134,46,0.18)',
        overflowX: 'auto',
        marginBottom: 22,
        WebkitOverflowScrolling: 'touch',
      }}
      // Hide the scrollbar on overflow — the strip is still horizontally
      // scrollable, just without the chrome that would clash with the pill.
      className="circle-top-menu"
    >
      {items.map(item => {
        const active = item.matches(pathname)
        return (
          <Link
            key={item.label}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              textDecoration: 'none',
              padding: '8px 14px',
              borderRadius: 999,
              background: active ? ORANGE : 'transparent',
              color: active ? '#fff' : 'var(--text-soft)',
              fontSize: 12.5, fontWeight: active ? 600 : 500,
              fontFamily: 'var(--font-body)',
              whiteSpace: 'nowrap', flexShrink: 0,
              letterSpacing: '0.01em',
              boxShadow: active ? '0 1px 2px rgba(140,101,32,0.18)' : 'none',
              transition: 'background 0.18s, color 0.18s, transform 0.15s',
            }}
            onMouseEnter={e => {
              if (active) return
              e.currentTarget.style.background = ORANGE_TINT
              e.currentTarget.style.color = ORANGE_DEEP
            }}
            onMouseLeave={e => {
              if (active) return
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--text-soft)'
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', opacity: active ? 1 : 0.75 }}>
              {item.icon}
            </span>
            {item.label}
          </Link>
        )
      })}

      <style>{`
        .circle-top-menu::-webkit-scrollbar { display: none; }
        .circle-top-menu { scrollbar-width: none; }
      `}</style>
    </nav>
  )
}

// ── Icons ────────────────────────────────────────────────────────────────────

function CircleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6" />
      <circle cx="8" cy="8" r="2" fill="currentColor" stroke="none" />
    </svg>
  )
}

function CommunityIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="6" r="2" />
      <circle cx="11" cy="6" r="2" />
      <path d="M2 13.5c0-2 1.5-3 3-3s3 1 3 3" />
      <path d="M8 13.5c0-2 1.5-3 3-3s3 1 3 3" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3h7a2 2 0 012 2v9H5a2 2 0 01-2-2V3z" />
      <path d="M3 3v9" />
      <path d="M6 6h4M6 9h3" />
    </svg>
  )
}

function CallIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="9" height="7" rx="1.4" />
      <path d="M11 8l3-2v5l-3-2z" />
    </svg>
  )
}

function PartnerIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12V6a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6l-3 2v-2z" />
    </svg>
  )
}
